import { db, projects, projectSettings, knowledgeEntries, documents, websiteSources, chatSessions, conversationMessages, eq, and, or, redisGet, redisSet } from '@portfoliochat/db';
import crypto from 'crypto';

export default async function (server) {
  server.post('/message', async (request, reply) => {
    const authHeader = request.headers['authorization'];
    const customTokenHeader = request.headers['x-portfolio-token'] || request.headers['x-api-key'];
    
    let token = customTokenHeader;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    const { projectId, apiKey, message, sessionId: incomingSessionId } = request.body || {};
    
    const finalApiKey = token || apiKey;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required field: message'
      });
    }

    if (!finalApiKey && !projectId) {
      return reply.status(401).send({
        success: false,
        error: 'Missing API authentication: Provide X-Portfolio-Token header, Bearer token, or apiKey/projectId in request body.'
      });
    }

    try {
      // 1. Authenticate & Fetch Project from DB via SHA-256 Key Hash or Widget Token
      let project = null;
      
      if (finalApiKey) {
        const hashedKey = crypto.createHash('sha256').update(finalApiKey).digest('hex');
        project = await db.query.projects.findFirst({
          where: or(
            eq(projects.apiKeyHash, hashedKey),
            eq(projects.widgetToken, finalApiKey)
          )
        });
      } else if (projectId) {
        project = await db.query.projects.findFirst({
          where: eq(projects.id, projectId)
        });
      }

      if (!project) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized: Invalid API key or Project ID not found.'
        });
      }

      if (projectId && finalApiKey) {
        const hashedKey = crypto.createHash('sha256').update(finalApiKey).digest('hex');
        if (project.id !== projectId || (project.apiKeyHash !== hashedKey && project.widgetToken !== finalApiKey)) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized: API Key does not match the provided Project ID.'
          });
        }
      }

      const activeProjectId = project.id;
      const sessionId = incomingSessionId || `session_${crypto.randomBytes(8).toString('hex')}`;

      // Fetch model & project settings from project_settings table
      const settings = await db.query.projectSettings.findFirst({
        where: eq(projectSettings.projectId, activeProjectId)
      }).catch(() => null);

      const isWidgetReq = finalApiKey && finalApiKey === project.widgetToken;
      const isSecretKeyReq = finalApiKey && finalApiKey.startsWith('pct_secret_');

      if (settings) {
        // 1. Master Toggle Checks
        if (isSecretKeyReq && settings.apiEnabled === false) {
          return reply.status(403).send({
            success: false,
            error: 'Forbidden: Headless API access is disabled for this project in Project Settings.'
          });
        }

        if (isWidgetReq && settings.widgetEnabled === false) {
          return reply.status(403).send({
            success: false,
            error: 'Forbidden: Widget embedding is disabled for this project in Project Settings.'
          });
        }

        // 2. Origin & Domain Verification
        const originHeader = request.headers['origin'] || request.headers['referer'] || '';
        if (originHeader) {
          try {
            const reqHost = new URL(originHeader).hostname;

            // CORS API Allowed Origins Check
            if (isSecretKeyReq && settings.apiAllowedOrigins && settings.apiAllowedOrigins.length > 0) {
              const allowedHosts = settings.apiAllowedOrigins.map((o) => {
                try { return new URL(o).hostname; } catch (e) { return o.replace(/^https?:\/\//, '').split('/')[0]; }
              });
              if (!allowedHosts.includes(reqHost)) {
                return reply.status(403).send({
                  success: false,
                  error: `Forbidden: API request origin '${reqHost}' is not in the allowed CORS origins list.`
                });
              }
            }

            // Widget Allowed Domains Check
            if (isWidgetReq && settings.allowedDomains && settings.allowedDomains.length > 0) {
              const allowedDomainsList = settings.allowedDomains.map((d) => {
                try { return new URL(d).hostname; } catch (e) { return d.replace(/^https?:\/\//, '').split('/')[0]; }
              });
              if (!allowedDomainsList.includes(reqHost)) {
                return reply.status(403).send({
                  success: false,
                  error: `Forbidden: Widget embedding is not permitted on domain '${reqHost}'.`
                });
              }
            }
          } catch (e) {
            console.warn('[CHAT API ORIGIN WARN]', e.message);
          }
        }

        // 3. API Rate Limiting (RPM) via Upstash Redis Sliding Window
        const maxRpm = settings.apiRateLimitRpm || project.apiRateLimitRpm || 20;
        const currentMinute = Math.floor(Date.now() / 60000);
        const rateKey = `ratelimit:${activeProjectId}:${currentMinute}`;

        try {
          const currentCount = (await redisGet(rateKey)) || 0;
          if (parseInt(currentCount, 10) >= maxRpm) {
            return reply.status(429).send({
              success: false,
              error: `Too Many Requests: Rate limit of ${maxRpm} requests per minute exceeded for this project.`
            });
          }
          await redisSet(rateKey, parseInt(currentCount, 10) + 1, 60);
        } catch (redisErr) {
          console.warn('[RATE LIMIT REDIS WARN]', redisErr.message);
        }
      }

      const activeModel = settings?.llmModel || project.llmModel || 'openai/gpt-oss-120b';
      const activeTemperature = settings?.temperature ? parseFloat(settings.temperature) : 0.3;
      const activeMaxTokens = settings?.maxTokens || 500;
      const activeTone = settings?.modelTone || 'professional';
      const activeLanguage = settings?.modelLanguage || 'auto';
      const customDirectives = settings?.systemInstructions || '';

      // 2. Vector Search / Knowledge Retrieval
      const cfWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || process.env.CF_WORKER_URL;
      const cfToken = process.env.CLOUDFLARE_WORKER_AUTH_TOKEN || process.env.CF_WORKER_AUTH_TOKEN;

      let retrievedChunks = [];
      
      if (cfWorkerUrl && cfToken) {
        try {
          console.log(`[CHAT API] Querying Cloudflare Vectorize DB for project ${activeProjectId}...`);
          const searchRes = await fetch(`${cfWorkerUrl}/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cfToken}`
            },
            body: JSON.stringify({
              query: message,
              projectId: activeProjectId,
              limit: 5
            })
          });

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.results && Array.isArray(searchData.results)) {
              retrievedChunks = searchData.results
                .map(r => {
                  const meta = r.metadata || {};
                  return {
                    text: r.text || meta.text || "",
                    score: r.score,
                    category: r.category || meta.category || 'general',
                    tags: r.tags || meta.tags || '',
                    source: meta.title || meta.documentId || r.documentId || 'Knowledge Base'
                  };
                })
                .filter(c => c.text);
            }
          }
        } catch (searchErr) {
          console.error('[CHAT API] Vector search fallback to DB due to error:', searchErr.message);
        }
      }

      // Fallback: If zero vector chunks retrieved, pull Knowledge Base items directly from Postgres
      if (retrievedChunks.length === 0) {
        console.log(`[CHAT API] Falling back to DB text retrieval for project ${activeProjectId}...`);
        const [entries, docs, webs] = await Promise.all([
          db.query.knowledgeEntries.findMany({
            where: eq(knowledgeEntries.projectId, activeProjectId),
            limit: 5
          }),
          db.query.documents.findMany({
            where: eq(documents.projectId, activeProjectId),
            limit: 3
          }),
          db.query.websiteSources.findMany({
            where: eq(websiteSources.projectId, activeProjectId),
            limit: 3
          })
        ]);

        for (const e of entries) {
          if (e.content) {
            retrievedChunks.push({
              text: `[Category: ${e.category || 'other'}]\nTitle: ${e.title}\n${e.content}`,
              score: 0.85,
              category: e.category,
              tags: (e.tags || []).join(', '),
              source: e.title
            });
          }
        }
        for (const d of docs) {
          if (d.extractedText) {
            retrievedChunks.push({
              text: `[Document: ${d.fileName}]\n${d.extractedText.substring(0, 800)}`,
              score: 0.8,
              category: 'document',
              tags: d.fileType,
              source: d.fileName
            });
          }
        }
        for (const w of webs) {
          if (w.extractedText) {
            retrievedChunks.push({
              text: `[Website Source: ${w.url} (${w.title || 'Page'})]\n${w.extractedText.substring(0, 800)}`,
              score: 0.8,
              category: 'website',
              tags: 'url',
              source: w.title || w.url
            });
          }
        }
      }

      // 3. Build System & User Context Prompt (Cleaned of raw DB headers)
      const contextBlock = retrievedChunks.length > 0
        ? retrievedChunks.map((c, idx) => {
            const sanitizedText = c.text
              .replace(/^\[Category: [^\]]+\]\s*/i, '')
              .replace(/^Title:\s*[^\n]+\s*/i, '')
              .replace(/^Tags:\s*[^\n]+\s*/i, '')
              .trim();
            return `Knowledge Fact ${idx + 1}:\n${sanitizedText || c.text}`;
          }).join('\n\n')
        : "No specific knowledge base content found for this query.";

      const systemPrompt = `You are the personal AI assistant for ${project.name}'s portfolio. Your goal is to represent ${project.name} accurately, naturally, and conversationally in a ${activeTone} tone.

CRITICAL RESPONSE GUIDELINES:
1. **Natural Conversational Synthesis**: Answer the user's question directly and conversationally using the knowledge base facts provided below.
2. **NO Meta-Preambles or DB Dumps**: NEVER start your response with "Based on the knowledge base", "According to snippet X", "Category:", "Title:", or raw key-value headers. Respond as an authentic, human-like AI portfolio assistant.
3. **Tone & Language**: Maintain a ${activeTone} tone throughout.${activeLanguage !== 'auto' ? ` Respond strictly in ${activeLanguage}.` : ''}
4. **Formatting**: Use clean, elegant Markdown formatting with bold text and bullet points where appropriate.
5. **Accuracy**: Stick strictly to true information contained in the Knowledge Base facts.
6. **Direct Output Only**: Do NOT output internal scratchpad reasoning or chain-of-thought analysis. Respond with the final answer immediately.

${customDirectives ? `CUSTOM INSTRUCTIONS:\n${customDirectives}\n` : ''}
KNOWLEDGE BASE FACTS:
${contextBlock}`;

      // 4. LLM Generation Call (Groq API using active model directly)
      let aiResponseText = "";
      const groqApiKey = process.env.GROQ_API_KEY;

      if (groqApiKey) {
        try {
          console.log(`[CHAT API] Calling Groq API with configured model '${activeModel}'...`);
          const groqRes = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqApiKey}`,
              },
              body: JSON.stringify({
                model: activeModel,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: message },
                ],
                temperature: activeTemperature,
                max_tokens: activeMaxTokens,
              }),
            },
          );

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            let rawContent = groqData.choices?.[0]?.message?.content || "";
            // Strip internal LLM reasoning block (<think>...</think>) if present in model response
            rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
            aiResponseText = rawContent;
          } else {
            const errText = await groqRes.text();
            console.error(`[CHAT API GROQ ERROR] Status ${groqRes.status}: ${errText}`);
          }
        } catch (groqErr) {
          console.error('[CHAT API GROQ EXCEPTION]', groqErr.message);
        }
      }

      // Fallback Response if LLM call fails or key is unconfigured
      if (!aiResponseText) {
        if (retrievedChunks.length > 0) {
          const cleanSnippet = retrievedChunks[0].text
            .replace(/\[Category: [^\]]+\]/gi, '')
            .replace(/Title:\s*[^\n]+/gi, '')
            .replace(/Tags:\s*[^\n]+/gi, '')
            .trim();
          aiResponseText = cleanSnippet || `Here is what I found in ${project.name}'s portfolio:\n\n${retrievedChunks[0].text}`;
        } else {
          aiResponseText = `Thank you for reaching out! I am the AI assistant for ${project.name}. Feel free to ask anything about experience, skills, or portfolio projects!`;
        }
      }

      // 5. Asynchronous Log of Chat Session & Conversation Message
      (async () => {
        try {
          await db.insert(chatSessions).values({
            id: sessionId,
            projectId: activeProjectId,
            source: 'api',
            turnCount: 1,
            lastActiveAt: new Date()
          }).onConflictDoNothing();

          await db.insert(conversationMessages).values({
            sessionId,
            projectId: activeProjectId,
            role: 'user',
            content: message,
            createdAt: new Date()
          });

          await db.insert(conversationMessages).values({
            sessionId,
            projectId: activeProjectId,
            role: 'assistant',
            content: aiResponseText,
            sources: retrievedChunks.map(c => ({
              text: c.text,
              score: c.score,
              category: c.category,
              source: c.source || c.category || 'Knowledge Base'
            })),
            createdAt: new Date()
          });
        } catch (logErr) {
          console.error('[CHAT API LOGGING ERROR]', logErr.message);
        }
      })();

      // 6. Return Clean JSON Response
      return reply.send({
        success: true,
        projectId: activeProjectId,
        sessionId,
        message,
        reply: aiResponseText,
        sources: retrievedChunks.map(c => ({
          score: c.score,
          category: c.category,
          source: c.source || c.category || 'Knowledge Base',
          snippet: c.text.substring(0, 150) + '...'
        })),
        developerConfig: {
          customCss: settings?.customCss || "",
          customHtml: settings?.customHtml || "",
          widgetVersion: settings?.widgetVersion || "v1.0.0",
        },
        usage: {
          creditsUsed: 1,
          remainingCredits: 499
        }
      });

    } catch (error) {
      console.error('[CHAT API ERROR]', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error processing chat message',
        details: error.message
      });
    }
  });
}
