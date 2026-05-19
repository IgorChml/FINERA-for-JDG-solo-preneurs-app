import type { FastifyPluginAsync } from 'fastify';
import { InsightRatingSchema } from '@finera/shared';
import { authenticate } from '../middleware/auth.js';
import { InsightService } from '../services/insight.service.js';

type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

const PERIOD_TYPE_MAP: Record<string, PeriodType> = {
  monthly: 'MONTHLY',
  quarterly: 'QUARTERLY',
  yearly: 'YEARLY',
};

const INSIGHT_DAILY_LIMIT = 3;

const insightRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const insightService = new InsightService(fastify);

  // GET /api/insights/:periodType/:period
  fastify.get('/:periodType/:period', {
    schema: { tags: ['insights'], summary: 'AI Insight Report (Premium)' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { periodType: rawType, period } = request.params as {
        periodType: string;
        period: string;
      };

      const periodType = PERIOD_TYPE_MAP[rawType.toLowerCase()];
      if (!periodType) {
        reply.status(400).send({ error: 'Invalid periodType. Use monthly|quarterly|yearly' });
        return;
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionStatus: true },
      });

      if (!user) {
        reply.status(404).send({ error: 'User not found' });
        return;
      }

      const isPremium = user.subscriptionStatus === 'PREMIUM' || user.subscriptionStatus === 'TRIAL';
      if (!isPremium) {
        reply.status(402).send({
          error: 'Funkcja Premium',
          code: 'PREMIUM_REQUIRED',
          message: 'AI Insight Engine dostępny w planie Premium',
        });
        return;
      }

      // Daily generation limit (cached reports don't count)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayGenerations = await fastify.prisma.insightReport.count({
        where: {
          userId,
          generatedAt: { gte: todayStart },
          // Only count fresh generations — cached ones don't affect limit
        },
      });

      if (todayGenerations >= INSIGHT_DAILY_LIMIT) {
        reply.status(429).send({
          error: 'Dzienny limit generacji raportów wyczerpany',
          limit: INSIGHT_DAILY_LIMIT,
          message: 'Możesz wygenerować max 3 raporty dziennie. Raport z cache jest zawsze dostępny.',
        });
        return;
      }

      const report = await insightService.generateOrGetCached(userId, period, periodType);
      reply.send({ report });
    },
  });

  // POST /api/insights/:id/rating
  fastify.post('/:id/rating', {
    schema: { tags: ['insights'], summary: 'Oceń narrację AI' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const { rating } = InsightRatingSchema.parse(request.body);

      await insightService.rateReport(id, userId, rating);
      reply.send({ success: true });
    },
  });
};

export default insightRoutes;
