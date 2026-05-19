import type { FastifyPluginAsync } from 'fastify';
import { RegisterSchema, LoginSchema } from '@finera/shared';
import { AuthService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Rejestracja nowego użytkownika',
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
        },
      },
    },
    handler: async (request, reply) => {
      const input = RegisterSchema.parse(request.body);
      const user = await authService.register(input);
      reply.status(201).send({ user, message: 'Konto utworzone. Sprawdź email, aby potwierdzić.' });
    },
  });

  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Logowanie',
    },
    handler: async (request, reply) => {
      const input = LoginSchema.parse(request.body);
      const result = await authService.login(input, request.ip);

      reply
        .setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh',
          maxAge: 30 * 24 * 60 * 60,
        })
        .send({
          accessToken: result.accessToken,
          expiresIn: 900,
          user: result.user,
        });
    },
  });

  fastify.post('/refresh', {
    schema: { tags: ['auth'], summary: 'Odśwież access token' },
    handler: async (request, reply) => {
      const refreshToken = request.cookies?.refreshToken;
      if (!refreshToken) {
        reply.status(401).send({ error: 'No refresh token' });
        return;
      }
      const tokens = await authService.refreshTokens(refreshToken);
      reply
        .setCookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh',
          maxAge: 30 * 24 * 60 * 60,
        })
        .send({ accessToken: tokens.accessToken, expiresIn: 900 });
    },
  });

  fastify.post('/logout', {
    preHandler: [authenticate],
    schema: { tags: ['auth'], summary: 'Wylogowanie' },
    handler: async (request, reply) => {
      const refreshToken = request.cookies?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      reply
        .clearCookie('refreshToken', { path: '/api/auth/refresh' })
        .send({ message: 'Wylogowano pomyślnie' });
    },
  });

  fastify.get('/verify-email/:token', {
    schema: { tags: ['auth'], summary: 'Weryfikacja adresu email' },
    handler: async (request, reply) => {
      const { token } = request.params as { token: string };
      await authService.verifyEmail(token);
      reply.send({ message: 'Email zweryfikowany pomyślnie' });
    },
  });

  fastify.get('/me', {
    preHandler: [authenticate],
    schema: { tags: ['auth'], summary: 'Dane zalogowanego użytkownika' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          createdAt: true,
          profile: true,
          subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
        },
      });
      if (!user) {
        reply.status(404).send({ error: 'User not found' });
        return;
      }
      reply.send({ user });
    },
  });
};

export default authRoutes;
