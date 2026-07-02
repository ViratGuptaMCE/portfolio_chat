import { Receiver } from '@upstash/qstash';
import { db, documents, eq } from '@portfoliochat/db';
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
    const { documentId, projectId } = request.body || {};
    console.log(`[API INGEST START] Received ingestion request for documentId: ${documentId}, projectId: ${projectId}`);
    
    if (!documentId || !projectId) {
      console.error("[API INGEST ERROR] Missing documentId or projectId.");
      return reply.status(400).send({ error: 'Missing documentId or projectId' });
    }

    try {
      // 1. Fetch document text from DB
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, documentId)
      });

      if (!doc || !doc.extractedText) {
        console.error(`[API INGEST ERROR] Document or extracted text missing for documentId: ${documentId}`);
        throw new Error("Document or extracted text not found");
      }

      console.log(`[API INGEST] Document "${doc.fileName}" fetched. Extracted text size: ${doc.extractedText.length} chars.`);

      // 2. Chunk text using LangChain
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 64,
        separators: ["\n\n", "\n", ". ", " "],
      });

      const chunks = await splitter.createDocuments([doc.extractedText]);
      const chunkTexts = chunks.map(c => c.pageContent);
      console.log(`[API INGEST] Text split into ${chunks.length} chunks.`);

      // 3. Send to CF Worker
      const cfWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || process.env.CF_WORKER_URL;
      const cfToken = process.env.CLOUDFLARE_WORKER_AUTH_TOKEN || process.env.CF_WORKER_AUTH_TOKEN;

      if (!cfWorkerUrl || !cfToken) {
        console.warn("[API INGEST WARNING] Cloudflare worker URL/Token not set in env. Marking document 'ready' directly.");
      } else {
        console.log(`[API INGEST] Dispatching ${chunks.length} chunks to Cloudflare Worker embedding endpoint...`);
        for (let i = 0; i < chunkTexts.length; i++) {
          const text = chunkTexts[i];
          const res = await fetch(`${cfWorkerUrl}/embed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cfToken}`
            },
            body: JSON.stringify({ text, documentId, projectId, chunkIndex: i })
          });

          if (!res.ok) {
            console.error(`[API INGEST ERROR] Failed to embed chunk ${i + 1}/${chunkTexts.length}: ${await res.text()}`);
            throw new Error("Failed to embed chunk at Cloudflare Worker");
          }
        }
        console.log("[API INGEST] All vector chunks embedded successfully.");
      }

      // 4. Update DB status to 'ready'
      await db.update(documents)
        .set({ status: 'ready', chunkCount: chunks.length, updatedAt: new Date() })
        .where(eq(documents.id, documentId));

      console.log(`[API INGEST COMPLETE] Document ${documentId} status updated to 'ready'.`);
      return { success: true, message: `Ingestion job completed for doc ${documentId}`, chunks: chunks.length };

    } catch (error) {
      console.error("[API INGEST FAILED]", error);
      
      await db.update(documents)
        .set({ status: 'failed', errorMessage: error.message, updatedAt: new Date() })
        .where(eq(documents.id, documentId));

      return reply.status(500).send({ error: error.message });
    }
  });
}
