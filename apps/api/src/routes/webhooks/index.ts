import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Receiver } from '@upstash/qstash';
import { db, documents } from '@portfoliochat/db';
import { eq } from 'drizzle-orm';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

async function verifyQStashSignature(request: FastifyRequest, reply: FastifyReply) {
  try {
    const signature = request.headers['upstash-signature'];
    if (!signature || typeof signature !== 'string') {
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

export default async function (server: FastifyInstance) {
  
  // Ingest Webhook - Triggered by Next.js or via QStash
  server.post('/ingest', { preHandler: verifyQStashSignature }, async (request, reply) => {
    const { documentId, projectId } = request.body as { documentId: string, projectId: string };
    
    if (!documentId || !projectId) {
      return reply.status(400).send({ error: 'Missing documentId or projectId' });
    }

    try {
      // 1. Fetch document text from DB
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, documentId)
      });

      if (!doc || !doc.extractedText) {
        throw new Error("Document or extracted text not found");
      }

      // 2. Chunk text using LangChain
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 64,
        separators: ["\n\n", "\n", ". ", " "],
      });

      const chunks = await splitter.createDocuments([doc.extractedText]);
      const chunkTexts = chunks.map(c => c.pageContent);

      // 3. Send to CF Worker
      const cfWorkerUrl = process.env.CF_WORKER_URL;
      const cfToken = process.env.CF_WORKER_AUTH_TOKEN;

      if (!cfWorkerUrl || !cfToken) {
        throw new Error("Cloudflare worker URL or token missing from environment");
      }

      // For MVP, we send chunks sequentially or in small batches
      for (const text of chunkTexts) {
        const res = await fetch(`${cfWorkerUrl}/embed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfToken}`
          },
          body: JSON.stringify({
            text,
            documentId,
            projectId
          })
        });

        if (!res.ok) {
          server.log.error(`Failed to embed chunk: ${await res.text()}`);
          throw new Error("Failed to embed chunk at Cloudflare Worker");
        }
      }

      // 4. Update DB status to 'ready'
      await db.update(documents)
        .set({ status: 'ready', chunkCount: chunks.length, updatedAt: new Date() })
        .where(eq(documents.id, documentId));

      return { success: true, message: `Ingestion job completed for doc ${documentId}`, chunks: chunks.length };

    } catch (error: any) {
      server.log.error(error);
      
      await db.update(documents)
        .set({ status: 'failed', errorMessage: error.message, updatedAt: new Date() })
        .where(eq(documents.id, documentId));

      return reply.status(500).send({ error: error.message });
    }
  });

}
