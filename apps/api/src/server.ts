import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { Queue } from 'bullmq';

import { env, config } from './config.js';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import authRoutes from './routes/auth.route.js';
import invoiceRoutes from './routes/invoice.route.js';
import ksefRoutes from './routes/ksef.route.js';
import taxRoutes from './routes/tax.route.js';
import profileRoutes from './routes/profile.route.js';
import costRoutes from './routes/cost.route.js';
import chatRoutes from './routes/chat.route.js';
import ocrRoutes from './routes/ocr.route.js';
import insightRoutes from './routes/insight.route.js';
import educationRoutes from './routes/education.route.js';
import revenuecatWebhook from './routes/webhooks/revenuecat.js';

declare module 'fastify' {
  interface FastifyInstance {
    ksefQueue?: Queue;
  }
  interface FastifyRequest {
    user: {
      sub: string;
      email: string;
      type: string;
      iat: number;
      exp: number;
    };
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.isDev ? 'info' : 'warn',
      ...(config.isDev && { transport: { target: 'pino-pretty' } }),
    },
    trustProxy: true,
  });

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Cookie (for httpOnly refresh token)
  await app.register(cookie, {
    secret: env.JWT_SECRET,
    hook: 'onRequest',
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '15m' },
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: config.isProd ? 100 : 1000,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'Za dużo zapytań. Spróbuj za chwilę.',
      statusCode: 429,
    }),
  });

  // Swagger docs (dev only)
  if (!config.isProd) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'FINERA API',
          description: 'Mobilny asystent finansowo-podatkowy dla JDG',
          version: '1.0.0',
        },
        tags: [
          { name: 'auth', description: 'Autentykacja' },
          { name: 'profile', description: 'Profil JDG' },
          { name: 'invoices', description: 'Faktury' },
          { name: 'ksef', description: 'Integracja KSeF' },
          { name: 'tax', description: 'Kalkulacje podatkowe' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list' },
    });
  }

  // Database & Cache
  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const message = error.message ?? 'Internal server error';

    if (statusCode >= 500) {
      app.log.error({ err: error, url: request.url }, 'Unhandled error');
    }

    reply.status(statusCode).send({
      error: message,
      statusCode,
      ...(config.isDev && { stack: error.stack }),
    });
  });

  // Routes
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(invoiceRoutes, { prefix: '/api/invoices' });
  app.register(ksefRoutes, { prefix: '/api/ksef' });
  app.register(taxRoutes, { prefix: '/api/tax' });
  app.register(profileRoutes, { prefix: '/api/profile' });
  app.register(costRoutes, { prefix: '/api/costs' });
  app.register(chatRoutes, { prefix: '/api/chat' });
  app.register(ocrRoutes, { prefix: '/api/ocr' });
  app.register(insightRoutes, { prefix: '/api/insights' });
  app.register(educationRoutes, { prefix: '/api/education' });
  app.register(revenuecatWebhook, { prefix: '/webhooks/revenuecat' });

  // Health check
  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  return app;
}

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`FINERA API uruchomione na porcie ${env.PORT}`);
    if (!config.isProd) {
      app.log.info(`Dokumentacja API: http://localhost:${env.PORT}/docs`);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const gracefulShutdown = async () => {
    app.log.info('Zamykanie serwera...');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

main();
