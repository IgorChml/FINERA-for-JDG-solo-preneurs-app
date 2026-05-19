import type { FastifyPluginAsync } from 'fastify';
import { KSeFTokenSchema } from '@finera/shared';
import { KSeFAdapter } from '../integrations/ksef.adapter.js';
import { authenticate } from '../middleware/auth.js';

const ksefRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/token', {
    schema: { tags: ['ksef'], summary: 'Zapisz token KSeF' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { token, environment } = KSeFTokenSchema.parse(request.body);

      const adapter = new KSeFAdapter(environment);
      const isValid = await adapter.validateToken(token);

      if (!isValid) {
        reply.status(400).send({ error: 'Token KSeF jest nieprawidłowy lub wygasł' });
        return;
      }

      const ksefToken = await fastify.prisma.kSeFToken.upsert({
        where: { userId },
        update: { token, environment, status: 'ACTIVE', updatedAt: new Date() },
        create: { userId, token, environment, status: 'ACTIVE' },
      });

      reply.send({ success: true, environment: ksefToken.environment, status: ksefToken.status });
    },
  });

  fastify.get('/token', {
    schema: { tags: ['ksef'], summary: 'Status tokenu KSeF' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const ksefToken = await fastify.prisma.kSeFToken.findUnique({
        where: { userId },
        select: { environment: true, status: true, lastSyncAt: true, expiresAt: true },
      });

      if (!ksefToken) {
        reply.status(404).send({ error: 'Token KSeF nie skonfigurowany' });
        return;
      }

      reply.send({ token: ksefToken });
    },
  });

  fastify.delete('/token', {
    schema: { tags: ['ksef'], summary: 'Usuń token KSeF' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      await fastify.prisma.kSeFToken.deleteMany({ where: { userId } });
      reply.send({ success: true });
    },
  });

  fastify.post('/sync', {
    schema: { tags: ['ksef'], summary: 'Wyzwól sync z KSeF' },
    handler: async (request, reply) => {
      const userId = request.user.sub;

      const ksefToken = await fastify.prisma.kSeFToken.findUnique({ where: { userId } });
      if (!ksefToken || ksefToken.status !== 'ACTIVE') {
        reply.status(400).send({ error: 'Brak aktywnego tokenu KSeF' });
        return;
      }

      // Add sync job to queue
      const queue = fastify.ksefQueue;
      if (!queue) {
        reply.status(503).send({ error: 'Kolejka synchronizacji niedostępna' });
        return;
      }

      const job = await queue.add(
        'sync',
        { userId, environment: ksefToken.environment },
        { priority: 1 }
      );

      reply.send({ jobId: job.id, message: 'Synchronizacja z KSeF uruchomiona' });
    },
  });

  fastify.get('/sync/history', {
    schema: { tags: ['ksef'], summary: 'Historia synchronizacji' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const jobs = await fastify.prisma.kSeFSyncJob.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });

      reply.send({ jobs });
    },
  });
};

export default ksefRoutes;
