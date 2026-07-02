import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import webhookRoutes from './routes/webhooks/index.js';
import internalRoutes from './routes/internal/index.js';

// Load environment variables from the root .env.local
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

const server = fastify({ logger: true });

// Register Plugins
server.register(cors, {
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
});

// Register routes
server.register(webhookRoutes, { prefix: '/webhooks' });
server.register(internalRoutes, { prefix: '/internal' });

// Health check
server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`API Server running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
