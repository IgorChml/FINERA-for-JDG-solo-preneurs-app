import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access';
  iat: number;
  exp: number;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify<JwtPayload>();
    if (request.user.type !== 'access') {
      reply.status(401).send({ error: 'Invalid token type' });
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized — invalid or expired token' });
  }
}

export function requireAuth(fastify: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
  };
}
