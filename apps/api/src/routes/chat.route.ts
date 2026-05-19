import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { TaxChatService } from '../ai/chat.service.js';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const chatService = new TaxChatService(fastify);

  fastify.post('/', {
    schema: { tags: ['chat'], summary: 'Konsjerż podatkowy AI' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { message, history } = request.body as {
        message: string;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      };

      if (!message?.trim()) {
        reply.status(400).send({ error: 'Wiadomość jest wymagana' });
        return;
      }

      const profile = await fastify.prisma.jDGProfile.findUnique({ where: { userId } });
      const result = await chatService.chat(message, history ?? [], profile);

      reply.send(result);
    },
  });
};

export default chatRoutes;
