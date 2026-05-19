import type { FastifyPluginAsync } from 'fastify';
import { CreateInvoiceSchema, InvoiceListParamsSchema, UpdateInvoiceStatusSchema } from '@finera/shared';
import { InvoiceService } from '../services/invoice.service.js';
import { authenticate } from '../middleware/auth.js';

const invoiceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const invoiceService = new InvoiceService(fastify);

  fastify.get('/', {
    schema: { tags: ['invoices'], summary: 'Lista faktur' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const params = InvoiceListParamsSchema.parse(request.query);
      const result = await invoiceService.getInvoices(userId, params);
      reply.send(result);
    },
  });

  fastify.post('/', {
    schema: { tags: ['invoices'], summary: 'Utwórz fakturę' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const input = CreateInvoiceSchema.parse(request.body);
      const invoice = await invoiceService.createInvoice(userId, input);
      reply.status(201).send({ invoice });
    },
  });

  fastify.get('/:id', {
    schema: { tags: ['invoices'], summary: 'Szczegóły faktury' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const invoice = await invoiceService.getInvoiceById(userId, id);
      reply.send({ invoice });
    },
  });

  fastify.patch('/:id/status', {
    schema: { tags: ['invoices'], summary: 'Zmień status faktury' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const { status, paymentDate } = UpdateInvoiceStatusSchema.parse(request.body);
      const invoice = await invoiceService.updateInvoiceStatus(userId, id, status, paymentDate);
      reply.send({ invoice });
    },
  });

  fastify.get('/dashboard/summary', {
    schema: { tags: ['invoices'], summary: 'Podsumowanie miesięczne' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const now = new Date();
      const { month = now.getMonth() + 1, year = now.getFullYear() } = request.query as {
        month?: number;
        year?: number;
      };
      const summary = await invoiceService.getDashboardSummary(userId, Number(month), Number(year));
      reply.send({ summary });
    },
  });
};

export default invoiceRoutes;
