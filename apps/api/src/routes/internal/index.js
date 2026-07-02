import { db, projects, eq } from '@portfoliochat/db';

export default async function (server) {
  server.get('/projects/:projectId', async (request, reply) => {
    const { projectId } = request.params;
    
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
