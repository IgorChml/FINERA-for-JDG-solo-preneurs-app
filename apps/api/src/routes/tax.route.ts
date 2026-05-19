import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { TaxService } from '../services/tax.service.js';

const taxRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const taxService = new TaxService(fastify);

  fastify.get('/reserves/:year/:month', {
    schema: { tags: ['tax'], summary: 'Oblicz i pobierz rezerwy podatkowe' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { year, month } = request.params as { year: string; month: string };
      const result = await taxService.calculateAndSaveReserve(
        userId,
        parseInt(month, 10),
        parseInt(year, 10)
      );
      reply.send(result);
    },
  });

  fastify.get('/payments/upcoming', {
    schema: { tags: ['tax'], summary: 'Nadchodzące płatności podatkowe' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const payments = await taxService.getUpcomingPayments(userId);
      reply.send({ payments });
    },
  });

  fastify.post('/payments/qr', {
    schema: { tags: ['tax'], summary: 'Generuj QR kod przelewu' },
    handler: async (request, reply) => {
      const { accountNumber, amount, recipient, title } = request.body as {
        accountNumber: string;
        amount: number;
        recipient: string;
        title: string;
      };

      const qrDataUrl = await taxService.generatePaymentQr(
        accountNumber,
        amount,
        recipient,
        title
      );
      reply.send({ qrDataUrl });
    },
  });
};

export default taxRoutes;
