import { db, projects, knowledgeEntries, documents, websiteSources, chatSessions, conversationMessages, eq, and, or } from '@portfoliochat/db';
import crypto from 'crypto';

export default async function (server) {
  // POST /v1/chat/message or POST /api/chat
  server.post('/message', async (request, reply) => {
    const authHeader = request.headers['authorization'];
    const customTokenHeader = request.headers['x-portfolio-token'] || request.headers['x-api-key'];
    
    // Extract token from Authorization header (Bearer pct_...) or custom headers or body
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
                .filter(r => r.text)
                .map(r => ({
                  text: r.text,
                  score: r.score,
                  category: r.category || 'general',
                  tags: r.tags || ''
                }));
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
              tags: (e.tags || []).join(', ')
            });
          }
        }
        for (const d of docs) {
          if (d.extractedText) {
            retrievedChunks.push({
              text: `[Document: ${d.fileName}]\n${d.extractedText.substring(0, 800)}`,
              score: 0.8,
              category: 'document',
              tags: d.fileType
            });
          }
        }
        for (const w of webs) {
          if (w.extractedText) {
            retrievedChunks.push({
              text: `[Website Source: ${w.url} (${w.title || 'Page'})]\n${w.extractedText.substring(0, 800)}`,
              score: 0.8,
              category: 'website',
              tags: 'url'
            });
          }
        }
      }

      // 3. Build System & User Context Prompt
      const contextBlock = retrievedChunks.length > 0
        ? retrievedChunks.map((c, idx) => `[Snippet ${idx + 1}]\n${c.text}`).join('\n\n---\n\n')
        : "No specific knowledge base content found for this query.";

      const systemPrompt = `You are the personal AI assistant for ${project.name}'s portfolio. Your goal is to represent ${project.name} professionally, warmly, and accurately.

Formatting & Tone Guidelines:
1. **Direct & Natural Tone**: NEVER use robotic preambles like "According to my knowledge base", "Based on the provided context", or "In the documents provided". Answer directly as an authentic portfolio representative.
2. **Clean Markdown Formatting**: Use structured Markdown formatting:
   - Use bolding (**Name / Title / Skill**) for key institutions, project names, companies, and skills.
   - Use clean bulleted lists (- ) or numbered steps (1. ) for multiple items.
   - Separate thoughts into short, readable paragraphs with clear line spacing.
3. **Factual Accuracy**: Answer based strictly on the knowledge base facts provided below. If something is not in the knowledge base, state politely that the information isn't available.

--- KNOWLEDGE BASE CONTEXT ---
${contextBlock}
--- END CONTEXT ---`;

      // 4. LLM Generation Call (Groq API or Fallback)
      let aiResponseText = "";
      const groqApiKey = process.env.GROQ_API_KEY;

      if (groqApiKey) {
        try {
          console.log(`[CHAT API] Calling Groq API with llama-3.3-70b-versatile...`);
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              temperature: 0.5,
              max_tokens: 1024
            })
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            aiResponseText = groqData.choices?.[0]?.message?.content || "";
          } else {
            const errText = await groqRes.text();
            console.error(`[CHAT API GROQ ERROR] Status ${groqRes.status}: ${errText}`);
          }
        } catch (groqErr) {
          console.error('[CHAT API GROQ EXCEPTION]', groqErr.message);
        }
      }

      // Fallback Response if LLM key is missing or errored
      if (!aiResponseText) {
        if (retrievedChunks.length > 0) {
          aiResponseText = `Based on the knowledge base for ${project.name}:\n\n${retrievedChunks[0].text.substring(0, 500)}...`;
        } else {
          aiResponseText = `Thank you for reaching out! I am the AI assistant for ${project.name}. Currently, no matching information was found in the project's knowledge base for your query.`;
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
            sources: retrievedChunks.map(c => ({ category: c.category, score: c.score })),
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
          snippet: c.text.substring(0, 150) + '...'
        })),
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
