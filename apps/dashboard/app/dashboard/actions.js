"use server";

import pdfParse from "pdf-parse";
import crypto from "crypto";
import { db, projects, knowledgeEntries, documents, websiteSources, redisGet, redisSet, redisDel } from "@portfoliochat/db";
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

    const result = await db.select({
      id: knowledgeEntries.id,
      title: knowledgeEntries.title,
      category: knowledgeEntries.category,
      content: knowledgeEntries.content,
      tags: knowledgeEntries.tags,
      status: knowledgeEntries.status,
      chunkCount: knowledgeEntries.chunkCount,
      version: knowledgeEntries.version,
      createdAt: knowledgeEntries.createdAt,
      updatedAt: knowledgeEntries.updatedAt
    })
    .from(knowledgeEntries)
    .innerJoin(projects, eq(knowledgeEntries.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(knowledgeEntries.projectId, projectId)
      )
    );

    const hasProcessing = result.some(item => item.status === 'processing' || item.status === 'pending');
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
  const apiUrl = process.env.API_URL || "http://localhost:8080";
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
  const isLocalTarget = apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");

  if (qstashToken && !isLocalTarget) {
    const destinationUrl = `${apiUrl}/webhooks/delete-vectors`;
    const cleanBase = rawQStashUrl.replace(/\/+$/, "").replace(/\/v2\/publish$/, "");
    const publishUrl = `${cleanBase}/v2/publish/${destinationUrl}`;

    console.log(`[QSTASH QUEUE] Publishing vector deletion job to Upstash QStash at ${publishUrl}...`);
    try {
      await fetch(publishUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Retries": "3"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error(`[QSTASH QUEUE ERROR] Failed to publish vector deletion to QStash:`, err.message);
    }
  }

  // Direct HTTP call fallback (for local development)
  fetch(`${apiUrl}/webhooks/delete-vectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => console.log(`[VECTOR DELETE API TRIGGER] Direct vector deletion response status: ${res.status}`))
    .catch((err) => console.log(`[VECTOR DELETE API TRIGGER] Direct API trigger: ${err.message}`));
}

export async function createKnowledgeEntry(userId, projectId, { title, category = "other", content, tags = [] }) {
  if (!userId || !projectId || !title || !content) throw new Error("Invalid input");
  
  try {
    // Verify project ownership
    const [project] = await db.select().from(projects).where(
      and(eq(projects.id, projectId), eq(projects.userId, userId))
    );
    if (!project) throw new Error("Unauthorized");

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
      chunkCount: Math.max(1, Math.ceil(content.length / 500)),
      version: 1
    }).returning();
    
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
        chunkCount: Math.max(1, Math.ceil(content.length / 500)),
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

    const estimatedChunks = Math.max(1, Math.ceil(extractedText.length / 500));
    console.log(`[DOC UPLOAD] Storing document. extractedText length: ${extractedText.length} chars (~${estimatedChunks} chunks).`);

    // Insert document into DB with status 'processing' and non-null extractedText
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

export async function addWebsiteSource(userId, projectId, rawUrl) {
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

    // 1. Initial insert into DB with 'processing' status
    const [inserted] = await db.insert(websiteSources).values({
      projectId,
      url: targetUrl,
      title: targetUrl,
      status: "processing"
    }).returning();

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
