"use server";

import pdfParse from "pdf-parse";
import crypto from "crypto";
import { db, projects, knowledgeEntries, documents, websiteSources, userDailyUsage, redisGet, redisSet, redisDel } from "@portfoliochat/db";
import { eq, and } from "drizzle-orm";

export async function getUserProjects(userId) {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    
    return userProjects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status, // "active", "ready", "processing"
      docsCount: 0, // Mock for now, would involve a JOIN with documents table
      lastUpdated: p.updatedAt ? p.updatedAt.toLocaleDateString() : "Just now"
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function createProject(userId, name) {
  if (!userId || !name) throw new Error("Invalid input");
  
  try {
    // Generate a unique slug, widget token, and secret API key
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const widgetToken = 'pct_pub_' + crypto.randomBytes(16).toString('hex');
    const rawApiKey = 'pct_secret_' + crypto.randomBytes(24).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    
    const [newProject] = await db.insert(projects).values({
      userId,
      name,
      slug,
      widgetToken,
      apiKeyHash,
      status: 'ready'
    }).returning();
    
    return { success: true, project: newProject, rawApiKey };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function getProjectById(userId, projectId) {
  if (!userId || !projectId) throw new Error("Invalid input");

  try {
    const [project] = await db.select().from(projects).where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    );

    if (!project) return null;

    // Backward compatibility auto-migration for existing projects missing an apiKeyHash
    if (!project.apiKeyHash) {
      const rawApiKey = 'pct_secret_' + crypto.randomBytes(24).toString('hex');
      const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

      await db.update(projects)
        .set({ apiKeyHash, updatedAt: new Date() })
        .where(eq(projects.id, projectId));

      project.apiKeyHash = apiKeyHash;
      project.initialRawApiKey = rawApiKey;
    }

    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function deleteProject(userId, projectId) {
  if (!userId || !projectId) throw new Error("Invalid input");

  try {
    // Fetch all documents & knowledge entries to cleanup vectors in Cloudflare Vectorize
    const projectDocs = await db.select({ id: documents.id, chunkCount: documents.chunkCount }).from(documents).where(eq(documents.projectId, projectId));
    const projectEntries = await db.select({ id: knowledgeEntries.id, chunkCount: knowledgeEntries.chunkCount }).from(knowledgeEntries).where(eq(knowledgeEntries.projectId, projectId));

    for (const d of projectDocs) {
      if (d.chunkCount > 0) triggerVectorDeletionWebhook({ documentId: d.id, chunkCount: d.chunkCount, projectId });
    }
    for (const e of projectEntries) {
      if (e.chunkCount > 0) triggerVectorDeletionWebhook({ entryId: e.id, chunkCount: e.chunkCount, projectId });
    }

    await db.delete(projects).where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId)
      )
    );

    await redisDel(`documents:${projectId}`);
    await redisDel(`knowledge:${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

// -- Knowledge Entries (Text) --

export async function getKnowledgeEntries(userId, projectId) {
  if (!userId || !projectId) return [];
  const cacheKey = `knowledge:${projectId}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

    const result = await db
      .select({
        id: knowledgeEntries.id,
        title: knowledgeEntries.title,
        category: knowledgeEntries.category,
        content: knowledgeEntries.content,
        tags: knowledgeEntries.tags,
        status: knowledgeEntries.status,
        chunkCount: knowledgeEntries.chunkCount,
        version: knowledgeEntries.version,
        createdAt: knowledgeEntries.createdAt,
        updatedAt: knowledgeEntries.updatedAt,
      })
      .from(knowledgeEntries)
      .innerJoin(projects, eq(knowledgeEntries.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, userId),
          eq(knowledgeEntries.projectId, projectId),
        ),
      );

    // Auto-heal stuck processing items older than 90 seconds
    const now = Date.now();
    let updatedAny = false;
    for (const item of result) {
      if (
        item.status === "processing" ||
        item.status === "pending" ||
        item.status === "scraping"
      ) {
        const itemAgeMs =
          now - new Date(item.updatedAt || item.createdAt).getTime();
        if (itemAgeMs > 1200000) {
          console.warn(
            `[AUTO-HEAL] Knowledge ${item.id} stuck in '${item.status}' for ${Math.round(itemAgeMs / 1000)}s. Auto-healing status to 'failed'.`,
          );
          await db
            .update(knowledgeEntries)
            .set({ status: "ready", updatedAt: new Date() })
            .where(eq(knowledgeEntries.id, item.id));
          item.status = "failed";
          updatedAny = true;
        }
      }
    }
    if (updatedAny) {
      await redisDel(`knowledge:${projectId}`);
    }

    const hasProcessing = result.some(
      (item) => item.status === "processing" || item.status === "pending",
    );
    if (result && !hasProcessing) {
      await redisSet(cacheKey, result, 3600);
    }
    return result;
  } catch (error) {
    console.error("Error fetching knowledge entries:", error);
    return [];
  }
}

async function triggerIngestionWebhook(payload) {
  const apiUrl = "http://localhost:8080";
  const qstashToken = process.env.QSTASH_TOKEN;
  const rawQStashUrl = process.env.QSTASH_URL || "https://qstash.upstash.io";
  const isLocalTarget = apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");

  if (qstashToken && !isLocalTarget) {
    const destinationUrl = `${apiUrl}/webhooks/ingest`;
    const cleanBase = rawQStashUrl.replace(/\/+$/, "").replace(/\/v2\/publish$/, "");
    const publishUrl = `${cleanBase}/v2/publish/${destinationUrl}`;

    console.log(`[QSTASH QUEUE] Publishing ingestion job to Upstash QStash at ${publishUrl}...`);
    try {
      const res = await fetch(publishUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Retries": "3"
        },
        body: JSON.stringify(payload)
      });
      
      const resText = await res.text();
      let data = {};
      try { data = JSON.parse(resText); } catch (e) { data = { text: resText }; }

      if (res.ok) {
        console.log(`[QSTASH QUEUE SUCCESS] Message queued with QStash messageId: ${data.messageId || JSON.stringify(data)}`);
      } else {
        console.warn(`[QSTASH QUEUE NOTE] QStash HTTP status: ${res.status} (${resText})`);
      }
    } catch (err) {
      console.error(`[QSTASH QUEUE ERROR] Failed to publish to QStash:`, err.message);
    }
  } else if (qstashToken && isLocalTarget) {
    console.log(`[QSTASH DEV NOTE] QStash requires a public target URL (e.g. https://api.portfoliochat.dev). Local target (${apiUrl}) bypassed for direct local webhook execution.`);
  }

  // Direct HTTP call fallback (for local development)
  fetch(`${apiUrl}/webhooks/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => console.log(`[INGEST API TRIGGER] Direct ingestion response status: ${res.status}`))
    .catch((err) => console.log(`[INGEST API TRIGGER] Direct API trigger: ${err.message}`));
}

async function triggerVectorDeletionWebhook(payload) {
  const apiUrl = process.env.API_URL || "http://localhost:8080";
  const qstashToken = process.env.QSTASH_TOKEN;
  const rawQStashUrl = process.env.QSTASH_URL || "https://qstash.upstash.io";
  const isLocalTarget =
    apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");

  if (qstashToken && !isLocalTarget) {
    const destinationUrl = `${apiUrl}/webhooks/delete-vectors`;
    const cleanBase = rawQStashUrl
      .replace(/\/+$/, "")
      .replace(/\/v2\/publish$/, "");
    const publishUrl = `${cleanBase}/v2/publish/${destinationUrl}`;

    console.log(
      `[QSTASH QUEUE] Publishing vector deletion job to Upstash QStash at ${publishUrl}...`,
    );
    try {
      await fetch(publishUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Retries": "3",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(
        `[QSTASH QUEUE ERROR] Failed to publish vector deletion to QStash:`,
        err.message,
      );
    }
  }

  // Direct HTTP call fallback (for local development)
  fetch(`${apiUrl}/webhooks/delete-vectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) =>
      console.log(
        `[VECTOR DELETE API TRIGGER] Direct vector deletion response status: ${res.status}`,
      ),
    )
    .catch((err) =>
      console.log(
        `[VECTOR DELETE API TRIGGER] Direct API trigger: ${err.message}`,
      ),
    );
}

async function incrementDailyUsage(userId, type) {
  const todayUtc = new Date().toISOString().split('T')[0];
  try {
    const [existing] = await db.select().from(userDailyUsage).where(
      and(eq(userDailyUsage.userId, userId), eq(userDailyUsage.usageDate, todayUtc))
    );

    if (!existing) {
      await db.insert(userDailyUsage).values({
        userId,
        usageDate: todayUtc,
        pdfUploadsCount: type === 'pdf' ? 1 : 0,
        knowledgeEntriesCount: type === 'knowledge' ? 1 : 0,
        urlImportsCount: type === 'url' ? 1 : 0
      });
    } else {
      const updateData = {};
      if (type === 'pdf') updateData.pdfUploadsCount = (existing.pdfUploadsCount || 0) + 1;
      if (type === 'knowledge') updateData.knowledgeEntriesCount = (existing.knowledgeEntriesCount || 0) + 1;
      if (type === 'url') updateData.urlImportsCount = (existing.urlImportsCount || 0) + 1;

      await db.update(userDailyUsage)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(userDailyUsage.id, existing.id));
    }
  } catch (error) {
    console.error("Error incrementing daily usage:", error);
  }
}

export async function getQuotaUsage(userId, projectId) {
  if (!userId || !projectId) return null;

  const todayUtc = new Date().toISOString().split('T')[0];

  try {
    let [dailyUsage] = await db.select().from(userDailyUsage).where(
      and(eq(userDailyUsage.userId, userId), eq(userDailyUsage.usageDate, todayUtc))
    );

    if (!dailyUsage) {
      dailyUsage = {
        pdfUploadsCount: 0,
        knowledgeEntriesCount: 0,
        urlImportsCount: 0
      };
    }

    const projectDocs = await db.select({ chunkCount: documents.chunkCount }).from(documents).where(eq(documents.projectId, projectId));
    const projectEntries = await db.select({ chunkCount: knowledgeEntries.chunkCount }).from(knowledgeEntries).where(eq(knowledgeEntries.projectId, projectId));
    const projectWebsites = await db.select({ chunkCount: websiteSources.chunkCount }).from(websiteSources).where(eq(websiteSources.projectId, projectId));

    const pdfChunksUsed = projectDocs.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0);
    const knowledgeChunksUsed = projectEntries.reduce((acc, entry) => acc + (entry.chunkCount || 0), 0);
    const webChunksUsed = projectWebsites.reduce((acc, web) => acc + (web.chunkCount || 0), 0);
    const urlsStoredCount = projectWebsites.length;

    return {
      pdf: {
        dailyUsed: dailyUsage.pdfUploadsCount || 0,
        dailyLimit: 10,
        chunksUsed: pdfChunksUsed,
        chunksLimit: 200
      },
      knowledge: {
        dailyUsed: dailyUsage.knowledgeEntriesCount || 0,
        dailyLimit: 50,
        chunksUsed: knowledgeChunksUsed,
        chunksLimit: 100
      },
      web: {
        dailyUsed: dailyUsage.urlImportsCount || 0,
        dailyLimit: 5,
        urlsStored: urlsStoredCount,
        urlsLimit: 5,
        chunksUsed: webChunksUsed,
        chunksLimit: 200
      }
    };
  } catch (error) {
    console.error("Error fetching quota usage:", error);
    return null;
  }
}

export async function createKnowledgeEntry(userId, projectId, { title, category = "other", content, tags = [] }) {
  if (!userId || !projectId || !title || !content) throw new Error("Invalid input");
  
  try {
    // Verify project ownership
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) throw new Error("Unauthorized");

    const estimatedChunks = Math.max(1, Math.ceil(content.length / 1750));

    // Quota pre-validation
    const quota = await getQuotaUsage(userId, projectId);
    if (quota) {
      if (quota.knowledge.dailyUsed >= quota.knowledge.dailyLimit) {
        return { success: false, error: `Daily Knowledge Entry limit reached (${quota.knowledge.dailyLimit}/${quota.knowledge.dailyLimit} today). Resets at 00:00 UTC.` };
      }
      if (quota.knowledge.chunksUsed + estimatedChunks > quota.knowledge.chunksLimit) {
        return { success: false, error: `Knowledge storage capacity exceeded (${quota.knowledge.chunksUsed}/${quota.knowledge.chunksLimit} chunks used). Adding ${estimatedChunks} chunks would exceed the limit. Delete existing entries to free up capacity.` };
      }
    }

    const parsedTags = Array.isArray(tags) 
      ? tags.map(t => t.trim()).filter(Boolean) 
      : typeof tags === "string" 
        ? tags.split(",").map(t => t.trim()).filter(Boolean) 
        : [];

    const [newEntry] = await db.insert(knowledgeEntries).values({
      projectId,
      title,
      category: category || "other",
      content,
      tags: parsedTags,
      status: 'processing',
      chunkCount: estimatedChunks,
      version: 1
    }).returning();
    
    // Increment daily quota counter
    await incrementDailyUsage(userId, 'knowledge');

    // Invalidate Redis cache
    await redisDel(`knowledge:${projectId}`);

    // Trigger asynchronous ingestion queue (Upstash QStash or Webhook)
    triggerIngestionWebhook({ entryId: newEntry.id, projectId });

    return { success: true, entry: newEntry };
  } catch (error) {
    console.error("Error creating knowledge entry:", error);
    return { success: false, error: error.message };
  }
}

export async function updateKnowledgeEntry(userId, projectId, entryId, { title, category = "other", content, tags = [] }) {
  if (!userId || !projectId || !entryId || !title || !content) throw new Error("Invalid input");

  try {
    // Verify project ownership
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) throw new Error("Unauthorized");

    // Fetch current entry to increment version & cleanup previous vector embeddings
    const [existing] = await db.select().from(knowledgeEntries).where(
      and(eq(knowledgeEntries.id, entryId), eq(knowledgeEntries.projectId, projectId))
    );
    if (!existing) throw new Error("Entry not found");

    const estimatedChunks = Math.max(1, Math.ceil(content.length / 1750));

    // Capacity pre-validation (editing does not consume daily reset counter, but enforces storage limit)
    const quota = await getQuotaUsage(userId, projectId);
    if (quota) {
      const netChunks = (quota.knowledge.chunksUsed - (existing.chunkCount || 0)) + estimatedChunks;
      if (netChunks > quota.knowledge.chunksLimit) {
        return { success: false, error: `Updating this entry to ${estimatedChunks} chunks would exceed the Knowledge storage limit (${quota.knowledge.chunksLimit} chunks max).` };
      }
    }

    // Purge previous vector chunks from Cloudflare Vectorize DB
    if (existing.chunkCount && existing.chunkCount > 0) {
      console.log(`[ENTRY EDIT] Purging ${existing.chunkCount} old vector chunks for entry ${entryId}...`);
      triggerVectorDeletionWebhook({ entryId, chunkCount: existing.chunkCount, projectId });
    }

    const parsedTags = Array.isArray(tags) 
      ? tags.map(t => t.trim()).filter(Boolean) 
      : typeof tags === "string" 
        ? tags.split(",").map(t => t.trim()).filter(Boolean) 
        : [];

    const nextVersion = (existing.version || 1) + 1;

    const [updatedEntry] = await db.update(knowledgeEntries)
      .set({
        title,
        category: category || "other",
        content,
        tags: parsedTags,
        status: 'processing',
        version: nextVersion,
        chunkCount: estimatedChunks,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(knowledgeEntries.id, entryId),
          eq(knowledgeEntries.projectId, projectId)
        )
      )
      .returning();

    // Invalidate Redis cache
    await redisDel(`knowledge:${projectId}`);

    // Trigger asynchronous ingestion queue (Upstash QStash or Webhook)
    triggerIngestionWebhook({ entryId: updatedEntry.id, projectId });

    return { success: true, entry: updatedEntry };
  } catch (error) {
    console.error("Error updating knowledge entry:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteKnowledgeEntry(userId, projectId, entryId) {
  try {
    const [entry] = await db.select({ chunkCount: knowledgeEntries.chunkCount }).from(knowledgeEntries).where(
      and(
        eq(knowledgeEntries.id, entryId),
        eq(knowledgeEntries.projectId, projectId)
      )
    );

    if (entry && entry.chunkCount > 0) {
      triggerVectorDeletionWebhook({ entryId, chunkCount: entry.chunkCount, projectId });
    }

    await db.delete(knowledgeEntries).where(
      and(
        eq(knowledgeEntries.id, entryId),
        eq(knowledgeEntries.projectId, projectId)
      )
    );
    await redisDel(`knowledge:${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Error deleting knowledge entry:", e);
    return { success: false };
  }
}

// -- Documents (Files) --

export async function getDocuments(userId, projectId) {
  if (!userId || !projectId) return [];
  const cacheKey = `documents:${projectId}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) return cached;

    const result = await db.select({
      id: documents.id,
      fileName: documents.fileName,
      fileType: documents.fileType,
      fileSizeBytes: documents.fileSizeBytes,
      extractedText: documents.extractedText,
      status: documents.status,
      chunkCount: documents.chunkCount,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt
    })
    .from(documents)
    .innerJoin(projects, eq(documents.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(documents.projectId, projectId)
      )
    );

    // Mark items stuck in processing for > 120s as 'failed' so user can retry vectorization
    const now = Date.now();
    let updatedAny = false;
    for (const item of result) {
      if (item.status === 'processing' || item.status === 'pending') {
        const itemAgeMs = now - new Date(item.updatedAt || item.createdAt).getTime();
        if (itemAgeMs > 60000) {
          console.warn(`[INGEST MONITOR] Document ${item.id} stuck in '${item.status}' for ${Math.round(itemAgeMs / 1000)}s. Setting status to 'failed'.`);
          await db.update(documents).set({ status: 'failed', errorMessage: 'Vector embedding timeout', updatedAt: new Date() }).where(eq(documents.id, item.id));
          item.status = 'failed';
          updatedAny = true;
        }
      }
    }
    if (updatedAny) {
      await redisDel(cacheKey);
    }

    const hasProcessing = result.some(item => item.status === 'processing' || item.status === 'pending');
    if (result && !hasProcessing) {
      await redisSet(cacheKey, result, 3600);
    }

    return result;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
}

export async function getDocumentText(userId, projectId, documentId) {
  if (!userId || !projectId || !documentId) return null;
  try {
    const [doc] = await db.select({
      id: documents.id,
      fileName: documents.fileName,
      fileType: documents.fileType,
      fileSizeBytes: documents.fileSizeBytes,
      extractedText: documents.extractedText,
      status: documents.status,
      chunkCount: documents.chunkCount,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt
    })
    .from(documents)
    .innerJoin(projects, eq(documents.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(documents.projectId, projectId),
        eq(documents.id, documentId)
      )
    );

    return doc || null;
  } catch (error) {
    console.error("Error fetching document text:", error);
    return null;
  }
}

export async function uploadDocument(userId, projectId, formData) {
  console.log(`[DOC UPLOAD START] Initiated document upload for userId: ${userId}, projectId: ${projectId}`);
  if (!userId || !projectId || !formData) {
    console.error("[DOC UPLOAD ERROR] Invalid input parameters.");
    throw new Error("Invalid input");
  }

  try {
    const file = formData.get("file");
    if (!file) {
      console.error("[DOC UPLOAD ERROR] No file found in FormData.");
      return { success: false, error: "No file provided" };
    }

    const fileName = file.name || "uploaded-document";
    const fileType = fileName.split('.').pop()?.toLowerCase() || 'unknown';

    if (fileType !== 'pdf') {
      console.error("[DOC UPLOAD ERROR] Invalid file type:", fileType);
      return { success: false, error: "Only PDF files are allowed" };
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      console.error(`[DOC UPLOAD ERROR] File size ${file.size} bytes exceeds 5MB limit.`);
      return { success: false, error: "File size exceeds 5MB limit" };
    }

    console.log(`[DOC UPLOAD] File received: "${fileName}" (type: ${fileType}, size: ${file.size} bytes)`);

    // Extract text content from file using real pdf-parse library for PDFs
    let extractedText = "";
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (fileType === 'pdf') {
        console.log(`[DOC UPLOAD] Parsing PDF binary buffer with pdf-parse...`);
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text ? pdfData.text.trim() : "";
        console.log(`[DOC UPLOAD] pdf-parse successfully extracted ${extractedText.length} chars from ${pdfData.numpages || 1} pages.`);
      } else {
        extractedText = buffer.toString('utf8').trim();
      }
    } catch (readErr) {
      console.error("[DOC UPLOAD ERROR] Failed to parse file text with pdf-parse:", readErr);
      extractedText = `Content from ${fileName}`;
    }

    if (!extractedText) {
      extractedText = `Document content for ${fileName}`;
    }

    const estimatedChunks = Math.max(1, Math.ceil(extractedText.length / 1750));
    console.log(`[DOC UPLOAD] Storing document. extractedText length: ${extractedText.length} chars (~${estimatedChunks} chunks).`);

    // Quota pre-validation
    const quota = await getQuotaUsage(userId, projectId);
    if (quota) {
      if (quota.pdf.dailyUsed >= quota.pdf.dailyLimit) {
        return { success: false, error: `Daily PDF upload limit reached (${quota.pdf.dailyLimit}/${quota.pdf.dailyLimit} today). Resets at 00:00 UTC.` };
      }
      if (quota.pdf.chunksUsed + estimatedChunks > quota.pdf.chunksLimit) {
        return { success: false, error: `PDF storage capacity exceeded (${quota.pdf.chunksUsed}/${quota.pdf.chunksLimit} chunks used). Uploading ${estimatedChunks} chunks would exceed the limit. Delete existing PDFs to free up capacity.` };
      }
    }

    // Insert document into DB with status 'processing' until Vectorize embedding succeeds
    const [newDoc] = await db.insert(documents).values({
      projectId,
      fileName,
      fileType,
      fileSizeBytes: file.size,
      extractedText,
      status: 'processing',
      chunkCount: estimatedChunks
    }).returning();

    console.log(`[DOC UPLOAD SUCCESS] Saved document ID: ${newDoc.id} with extractedText length ${newDoc.extractedText?.length || 0}. Status set to 'processing'.`);

    // Increment daily PDF uploads counter
    await incrementDailyUsage(userId, 'pdf');

    // Invalidate Redis cache
    await redisDel(`documents:${projectId}`);

    // Trigger background ingestion queue (Upstash QStash or Webhook)
    triggerIngestionWebhook({ documentId: newDoc.id, projectId });

    return { success: true, document: newDoc };
  } catch (error) {
    console.error("[DOC UPLOAD ERROR] Failed to process document upload:", error);
    return { success: false, error: error.message };
  }
}

export async function mockUploadDocument(userId, projectId, fileName) {
  return uploadDocument(userId, projectId, fileName);
}

export async function deleteDocument(userId, projectId, documentId) {
  try {
    const [doc] = await db.select({ chunkCount: documents.chunkCount }).from(documents).where(
      and(
        eq(documents.id, documentId),
        eq(documents.projectId, projectId)
      )
    );

    if (doc && doc.chunkCount > 0) {
      triggerVectorDeletionWebhook({ documentId, chunkCount: doc.chunkCount, projectId });
    }

    await db.delete(documents).where(
      and(
        eq(documents.id, documentId),
        eq(documents.projectId, projectId)
      )
    );
    await redisDel(`documents:${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Error deleting document:", e);
    return { success: false };
  }
}

export async function regenerateProjectApiKey(userId, projectId) {
  if (!userId || !projectId) throw new Error("Invalid input");

  try {
    const rawApiKey = 'pct_secret_' + crypto.randomBytes(24).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    await db.update(projects)
      .set({ apiKeyHash, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    return { success: true, rawApiKey };
  } catch (error) {
    console.error("Error regenerating API key:", error);
    return { success: false, error: "Failed to regenerate API key" };
  }
}

export async function getWebsiteSources(userId, projectId) {
  if (!userId || !projectId) throw new Error("Invalid input");
  try {
    const cached = await redisGet(`website_sources:${projectId}`);
    if (cached) return cached;

    const data = await db.select().from(websiteSources).where(eq(websiteSources.projectId, projectId));

    // Auto-heal stuck processing items older than 90 seconds
    const now = Date.now();
    let updatedAny = false;
    for (const item of data) {
      if (item.status === 'processing' || item.status === 'pending' || item.status === 'scraping') {
        const itemAgeMs = now - new Date(item.updatedAt || item.createdAt).getTime();
        if (itemAgeMs > 1200000) {
          console.warn(`[AUTO-HEAL] WebsiteSource ${item.id} stuck in '${item.status}' for ${Math.round(itemAgeMs / 1000)}s. Auto-healing status to 'failed'.`);
          await db.update(websiteSources).set({ status: 'ready', updatedAt: new Date() }).where(eq(websiteSources.id, item.id));
          item.status = 'failed';
          updatedAny = true;
        }
      }
    }
    if (updatedAny) {
      await redisDel(`website_sources:${projectId}`);
    }

    const hasProcessing = data.some(item => item.status === 'processing' || item.status === 'pending' || item.status === 'scraping');
    if (data && !hasProcessing) {
      await redisSet(`website_sources:${projectId}`, data, 3600);
    }
    return data;
  } catch (error) {
    console.error("Error fetching website sources:", error);
    return [];
  }
}

export async function fetchGithubRepos(username) {
  if (!username || !username.trim()) {
    return { success: false, error: "GitHub username is required" };
  }

  const cleanUser = username.trim().replace(/^@/, '');
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&sort=updated`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "PortfolioChat-App"
      },
      next: { revalidate: 60 }
    });

    if (res.status === 404) {
      return { success: false, error: `GitHub user "@${cleanUser}" not found.` };
    }

    if (!res.ok) {
      return { success: false, error: `GitHub API error (${res.status}). Please try again.` };
    }

    const repos = await res.json();
    if (!Array.isArray(repos)) {
      return { success: false, error: "Failed to fetch repositories list." };
    }

    const formattedRepos = repos
      .map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description || "No description provided.",
        htmlUrl: r.html_url,
        stars: r.stargazers_count,
        language: r.language || "Markdown",
        defaultBranch: r.default_branch || "main",
        updatedAt: r.updated_at
      }));

    return { success: true, username: cleanUser, repos: formattedRepos };
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return { success: false, error: error.message || "Failed to connect to GitHub" };
  }
}

export async function fetchGithubReadme(username, repoName, defaultBranch = "main") {
  if (!username || !repoName) {
    return { success: false, error: "Missing parameters" };
  }

  const cleanUser = username.trim().replace(/^@/, '');
  const cleanRepo = repoName.trim();

  try {
    // Attempt 1: GitHub API raw readme endpoint
    const apiRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(cleanUser)}/${encodeURIComponent(cleanRepo)}/readme`, {
      headers: {
        "Accept": "application/vnd.github.v3.raw",
        "User-Agent": "PortfolioChat-App"
      }
    });

    if (apiRes.ok) {
      const readmeContent = await apiRes.text();
      if (readmeContent && readmeContent.trim()) {
        return { success: true, content: readmeContent.trim(), repoUrl: `https://github.com/${cleanUser}/${cleanRepo}` };
      }
    }

    // Fallback: raw.githubusercontent.com with default branch or main/master
    const branchesToTry = [defaultBranch, "main", "master"];
    const filesToTry = ["README.md", "readme.md", "README", "Readme.md"];

    for (const b of branchesToTry) {
      for (const f of filesToTry) {
        const rawRes = await fetch(`https://raw.githubusercontent.com/${cleanUser}/${cleanRepo}/${b}/${f}`);
        if (rawRes.ok) {
          const content = await rawRes.text();
          if (content && content.trim()) {
            return { success: true, content: content.trim(), repoUrl: `https://github.com/${cleanUser}/${cleanRepo}` };
          }
        }
      }
    }

    return { success: false, error: `No README.md found in repository "${cleanUser}/${cleanRepo}".` };
  } catch (error) {
    console.error("Error fetching GitHub README:", error);
    return { success: false, error: error.message || "Failed to fetch README" };
  }
}

export async function addWebsiteSource(userId, projectId, rawUrl, preFetchedTitle = null, preFetchedContent = null) {
  if (!userId || !projectId || !rawUrl) throw new Error("Invalid input");

  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    // Verify project ownership
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) throw new Error("Unauthorized");

    const estimatedChunks = preFetchedContent 
      ? Math.max(1, Math.ceil(preFetchedContent.length / 1750)) 
      : 3;

    // Quota pre-validation
    const quota = await getQuotaUsage(userId, projectId);
    if (quota) {
      if (quota.web.dailyUsed >= quota.web.dailyLimit) {
        return { success: false, error: `Daily URL import limit reached (${quota.web.dailyLimit}/${quota.web.dailyLimit} today). Resets at 00:00 UTC.` };
      }
      if (quota.web.urlsStored >= quota.web.urlsLimit) {
        return { success: false, error: `Maximum simultaneous URL sources stored (${quota.web.urlsLimit}/${quota.web.urlsLimit}). Delete an existing website or GitHub README source to free up a slot.` };
      }
      if (quota.web.chunksUsed + estimatedChunks > quota.web.chunksLimit) {
        return { success: false, error: `Web content storage capacity exceeded (${quota.web.chunksUsed}/${quota.web.chunksLimit} chunks used). Delete existing web sources to free up capacity.` };
      }
    }

    // 1. Initial insert into DB with 'processing' status
    const [inserted] = await db.insert(websiteSources).values({
      projectId,
      url: targetUrl,
      title: preFetchedTitle || targetUrl,
      extractedText: preFetchedContent || null,
      status: "processing",
      chunkCount: estimatedChunks
    }).returning();

    // Increment daily URL imports counter
    await incrementDailyUsage(userId, 'url');

    // 2. Invalidate Redis cache
    await redisDel(`website_sources:${projectId}`);

    // 3. Trigger asynchronous ingestion queue (QStash or Webhook API)
    triggerIngestionWebhook({ websiteId: inserted.id, projectId });

    return { success: true, item: inserted };
  } catch (error) {
    console.error("Error adding website source:", error);
    return { success: false, error: error.message || "Failed to process website URL" };
  }
}

export async function deleteWebsiteSource(userId, projectId, websiteId) {
  if (!userId || !projectId || !websiteId) throw new Error("Invalid input");

  try {
    // Fetch target website record to retrieve chunk count for vector deletion
    const [existing] = await db.select().from(websiteSources).where(
      and(eq(websiteSources.id, websiteId), eq(websiteSources.projectId, projectId))
    );

    if (existing && existing.chunkCount && existing.chunkCount > 0) {
      triggerVectorDeletionWebhook({ documentId: websiteId, chunkCount: existing.chunkCount, projectId });
    }

    await db.delete(websiteSources).where(
      and(
        eq(websiteSources.id, websiteId),
        eq(websiteSources.projectId, projectId)
      )
    );
    await redisDel(`website_sources:${projectId}`);
    return { success: true };
  } catch (e) {
    console.error("Error deleting website source:", e);
    return { success: false, error: "Failed to delete website source" };
  }
}
