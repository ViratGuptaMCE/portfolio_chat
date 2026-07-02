import { Receiver } from '@upstash/qstash';
import { db, documents, knowledgeEntries, eq, redisDel } from '@portfoliochat/db';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

async function verifyQStashSignature(request, reply) {
  try {
    const signature = request.headers['upstash-signature'];
    if (!signature || typeof signature !== 'string') {
      if (process.env.NODE_ENV !== 'production' || !process.env.QSTASH_CURRENT_SIGNING_KEY) {
        console.log("[QSTASH DEV] Skipping Upstash signature verification for local development test call.");
        return;
      }
      reply.status(401).send({ error: 'Missing Upstash signature' });
      return;
    }
    
    const isValid = await receiver.verify({
      signature,
      body: JSON.stringify(request.body), 
    });
    
    if (!isValid) {
      reply.status(401).send({ error: 'Invalid Upstash signature' });
      return;
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ error: 'Signature verification failed' });
  }
}

export default async function (server) {
  // Ingest Webhook - Triggered by Next.js or via QStash
  server.post('/ingest', { preHandler: verifyQStashSignature }, async (request, reply) => {
    const { documentId, entryId, projectId } = request.body || {};
    console.log(`[API INGEST START] Ingestion requested: documentId=${documentId}, entryId=${entryId}, projectId=${projectId}`);
    
    if ((!documentId && !entryId) || !projectId) {
      console.error("[API INGEST ERROR] Missing documentId/entryId or projectId.");
      return reply.status(400).send({ error: 'Missing documentId/entryId or projectId' });
    }

    const cfWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || process.env.CF_WORKER_URL;
    const cfToken = process.env.CLOUDFLARE_WORKER_AUTH_TOKEN || process.env.CF_WORKER_AUTH_TOKEN;

    try {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 64,
        separators: ["\n\n", "\n", ". ", " "],
      });

      // --- Case 1: Knowledge Entry Ingestion ---
      if (entryId) {
        const entry = await db.query.knowledgeEntries.findFirst({
          where: eq(knowledgeEntries.id, entryId)
        });

        if (!entry || !entry.content) {
          throw new Error("Knowledge entry or content not found");
        }

        const formattedText = `[Category: ${entry.category || 'other'}]\nTitle: ${entry.title}\nTags: ${(entry.tags || []).join(', ')}\n\n${entry.content}`;
        const chunks = await splitter.createDocuments([formattedText]);
        const chunkTexts = chunks.map(c => c.pageContent);

        console.log(`[API INGEST] Knowledge entry "${entry.title}" split into ${chunks.length} chunks.`);

        if (cfWorkerUrl && cfToken) {
          for (let i = 0; i < chunkTexts.length; i++) {
            const res = await fetch(`${cfWorkerUrl}/embed`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cfToken}`
              },
              body: JSON.stringify({
                text: chunkTexts[i],
                documentId: entryId,
                entryId,
                projectId,
                category: entry.category,
                tags: entry.tags,
                chunkIndex: i
              })
            });
            if (!res.ok) {
              const errMsg = await res.text();
              console.error(`[API INGEST ERROR] Knowledge chunk embedding failed (${res.status}): ${errMsg}`);
            } else {
              console.log(`[API INGEST EMBEDDED] Knowledge chunk ${i + 1}/${chunkTexts.length} embedded at Cloudflare Worker.`);
            }
          }
        }

        await db.update(knowledgeEntries)
          .set({ status: 'ready', chunkCount: chunks.length, updatedAt: new Date() })
          .where(eq(knowledgeEntries.id, entryId));

        // Immediately invalidate Redis cache so UI polling receives updated 'ready' status
        await redisDel(`knowledge:${projectId}`);

        console.log(`[API INGEST COMPLETE] Knowledge entry ${entryId} status set to 'ready'. Redis cache invalidated.`);
        return { success: true, type: 'knowledge_entry', id: entryId, chunks: chunks.length };
      }

      // --- Case 2: PDF Document Ingestion ---
      if (documentId) {
        const doc = await db.query.documents.findFirst({
          where: eq(documents.id, documentId)
        });

        if (!doc || !doc.extractedText) {
          throw new Error("Document or extracted text not found");
        }

        const chunks = await splitter.createDocuments([doc.extractedText]);
        const chunkTexts = chunks.map(c => c.pageContent);

        console.log(`[API INGEST] Document "${doc.fileName}" split into ${chunks.length} chunks.`);

        if (cfWorkerUrl && cfToken) {
          for (let i = 0; i < chunkTexts.length; i++) {
            const res = await fetch(`${cfWorkerUrl}/embed`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cfToken}`
              },
              body: JSON.stringify({
                text: chunkTexts[i],
                documentId,
                projectId,
                category: 'document',
                tags: [doc.fileType || 'pdf'],
                chunkIndex: i
              })
            });
            if (!res.ok) {
              console.error(`[API INGEST ERROR] Document chunk embedding failed: ${await res.text()}`);
            }
          }
        }

        await db.update(documents)
          .set({ status: 'ready', chunkCount: chunks.length, updatedAt: new Date() })
          .where(eq(documents.id, documentId));

        // Immediately invalidate Redis cache so UI polling receives updated 'ready' status
        await redisDel(`documents:${projectId}`);

        console.log(`[API INGEST COMPLETE] Document ${documentId} status set to 'ready'. Redis cache invalidated.`);
        return { success: true, type: 'document', id: documentId, chunks: chunks.length };
      }

    } catch (error) {
      console.error("[API INGEST FAILED]", error);
      
      if (documentId) {
        await db.update(documents)
          .set({ status: 'failed', errorMessage: error.message, updatedAt: new Date() })
          .where(eq(documents.id, documentId));
        await redisDel(`documents:${projectId}`);
      }

      if (entryId) {
        await db.update(knowledgeEntries)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(knowledgeEntries.id, entryId));
        await redisDel(`knowledge:${projectId}`);
      }

      return reply.status(500).send({ error: error.message });
    }
  });

  // Delete Vectors Webhook - Triggered when document or knowledge entry is deleted
  server.post('/delete-vectors', { preHandler: verifyQStashSignature }, async (request, reply) => {
    const { documentId, entryId, chunkCount, projectId } = request.body || {};
    const targetId = documentId || entryId;
    console.log(`[API VECTOR DELETE START] Deleting vectors for id: ${targetId}, chunkCount: ${chunkCount}, projectId: ${projectId}`);

    if (!targetId || !chunkCount) {
      console.error("[API VECTOR DELETE ERROR] Missing documentId/entryId or chunkCount.");
      return reply.status(400).send({ error: 'Missing documentId/entryId or chunkCount' });
    }

    const cfWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || process.env.CF_WORKER_URL;
    const cfToken = process.env.CLOUDFLARE_WORKER_AUTH_TOKEN || process.env.CF_WORKER_AUTH_TOKEN;

    if (!cfWorkerUrl || !cfToken) {
      console.warn("[API VECTOR DELETE WARNING] Cloudflare worker URL/Token not configured.");
      return { success: false, message: "Cloudflare worker not configured" };
    }

    try {
      const res = await fetch(`${cfWorkerUrl}/delete-vectors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfToken}`
        },
        body: JSON.stringify({ documentId: targetId, chunkCount })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[API VECTOR DELETE ERROR] Cloudflare Worker returned ${res.status}: ${errText}`);
        return reply.status(res.status).send({ error: errText });
      }

      const data = await res.json();
      console.log(`[API VECTOR DELETE COMPLETE] Successfully deleted ${data.deletedCount || chunkCount} vector chunks from Cloudflare Vectorize.`);
      return { success: true, ...data };
    } catch (error) {
      console.error("[API VECTOR DELETE FAILED]", error);
      return reply.status(500).send({ error: error.message });
    }
  });
}
