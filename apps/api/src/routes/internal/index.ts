import { FastifyInstance } from 'fastify';
import { db, projects } from '@portfoliochat/db';
import { eq } from 'drizzle-orm';

export default async function (server: FastifyInstance) {
  // Example internal route: Get project details
  // Note: In production, you would verify the Better Auth session token here
  server.get('/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });
      
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      
      return { project };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
