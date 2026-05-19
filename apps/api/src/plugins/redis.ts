import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';
import { env } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    fastify.log.error({ err }, 'Redis connection error');
  });

  await redis.connect().catch(() => {
    fastify.log.warn('Redis not available — some features will be degraded');
  });

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});

export default redisPlugin;
