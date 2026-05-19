import type { FastifyPluginAsync } from 'fastify';
import { createHmac } from 'crypto';
import { env } from '../../config.js';

interface RevenueCatEvent {
  event: {
    type: string;
    app_user_id: string;
    expiration_at_ms?: number;
    period_type?: string;
  };
}

const EVENT_MAP: Record<string, 'FREE' | 'TRIAL' | 'PREMIUM' | 'EXPIRED'> = {
  INITIAL_PURCHASE: 'PREMIUM',
  RENEWAL: 'PREMIUM',
  TRIAL_STARTED: 'TRIAL',
  TRIAL_CONVERTED: 'PREMIUM',
  TRIAL_CANCELLED: 'FREE',
  CANCELLATION: 'PREMIUM', // Keep active until expiry
  EXPIRATION: 'EXPIRED',
  BILLING_ISSUE: 'PREMIUM', // Keep active during grace period
};

const revenuecatWebhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', {
    config: { rawBody: true },
    schema: { hide: true },
    handler: async (request, reply) => {
      const secret = env.REVENUECAT_WEBHOOK_SECRET;

      // Verify webhook signature when secret is configured
      if (secret) {
        const signature = request.headers['x-revenuecat-signature'] as string;
        if (!signature) {
          reply.status(401).send({ error: 'Missing signature' });
          return;
        }

        const expected = createHmac('sha256', secret)
          .update(JSON.stringify(request.body))
          .digest('hex');

        if (signature !== expected) {
          reply.status(401).send({ error: 'Invalid signature' });
          return;
        }
      }

      const payload = request.body as RevenueCatEvent;
      const { type, app_user_id, expiration_at_ms } = payload.event;

      const newStatus = EVENT_MAP[type];
      if (!newStatus) {
        // Unknown event type — acknowledge but ignore
        reply.send({ received: true });
        return;
      }

      const expiryDate = expiration_at_ms ? new Date(expiration_at_ms) : null;

      // Find user by RevenueCat ID
      const user = await fastify.prisma.user.findFirst({
        where: { revenuecatUserId: app_user_id },
      });

      if (!user) {
        fastify.log.warn({ app_user_id, type }, 'RevenueCat webhook: user not found');
        reply.send({ received: true });
        return;
      }

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: newStatus,
          subscriptionExpiry: expiryDate,
        },
      });

      fastify.log.info({ userId: user.id, type, newStatus }, 'RevenueCat subscription updated');
      reply.send({ received: true });
    },
  });
};

export default revenuecatWebhookRoutes;
