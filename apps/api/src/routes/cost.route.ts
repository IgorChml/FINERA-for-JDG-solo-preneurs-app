import type { FastifyPluginAsync } from 'fastify';
import { CreateCostSchema, OcrScanSchema } from '@finera/shared';
import { authenticate } from '../middleware/auth.js';
import { CostAiService } from '../ai/cost-ai.service.js';

const costRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const aiService = new CostAiService(fastify);

  fastify.get('/', {
    schema: { tags: ['costs'], summary: 'Lista kosztów' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const costs = await fastify.prisma.cost.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 50,
      });
      reply.send({ data: costs });
    },
  });

  fastify.post('/', {
    schema: { tags: ['costs'], summary: 'Dodaj koszt' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const input = CreateCostSchema.parse(request.body);

      const cost = await fastify.prisma.cost.create({
        data: {
          userId,
          amount: input.amount,
          currency: input.currency ?? 'PLN',
          category: input.category,
          vendor: input.vendor,
          vendorNip: input.vendorNip,
          description: input.description,
          date: input.date,
          receiptImageUrl: input.receiptImageUrl,
          isDeductible: true,
        },
      });

      reply.status(201).send({ cost });
    },
  });

  fastify.post('/scan', {
    schema: { tags: ['costs'], summary: 'OCR + AI Pre-Audyt paragonu' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { imageBase64, imageType } = OcrScanSchema.parse(request.body);

      const profile = await fastify.prisma.jDGProfile.findUnique({ where: { userId } });

      const result = await aiService.scanAndAudit(imageBase64, imageType, profile?.taxForm ?? 'SCALE');

      reply.send(result);
    },
  });
};

export default costRoutes;
