import type { FastifyPluginAsync } from 'fastify';
import { OcrScanRequestSchema, RiskAuditRequestSchema, SaveCostFromOcrSchema } from '@finera/shared';
import { authenticate } from '../middleware/auth.js';
import { OcrService } from '../services/ocr.service.js';

const FREE_OCR_LIMIT = 10;

const ocrRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate);
  const ocrService = new OcrService(fastify);

  // POST /api/ocr/extract
  fastify.post('/extract', {
    schema: { tags: ['ocr'], summary: 'Ekstrakcja danych z obrazu dokumentu' },
    handler: async (request, reply) => {
      const userId = request.user.sub;

      // Check OCR quota for free users
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionStatus: true, ocrUsedThisMonth: true, ocrResetDate: true },
      });

      if (!user) {
        reply.status(404).send({ error: 'User not found' });
        return;
      }

      const now = new Date();
      const isFreeUser = user.subscriptionStatus === 'FREE' || user.subscriptionStatus === 'EXPIRED';

      // Reset monthly counter on 1st of month
      const needsReset =
        !user.ocrResetDate ||
        user.ocrResetDate.getMonth() !== now.getMonth() ||
        user.ocrResetDate.getFullYear() !== now.getFullYear();

      if (needsReset) {
        await fastify.prisma.user.update({
          where: { id: userId },
          data: { ocrUsedThisMonth: 0, ocrResetDate: now },
        });
        user.ocrUsedThisMonth = 0;
      }

      if (isFreeUser && user.ocrUsedThisMonth >= FREE_OCR_LIMIT) {
        reply.status(402).send({
          error: 'Limit skanowań wyczerpany',
          code: 'OCR_LIMIT_REACHED',
          limit: FREE_OCR_LIMIT,
          used: user.ocrUsedThisMonth,
          message: `Plan Free obejmuje ${FREE_OCR_LIMIT} skanowań miesięcznie. Przejdź na Premium dla nieograniczonego dostępu.`,
        });
        return;
      }

      const { imageBase64, mediaType } = OcrScanRequestSchema.parse(request.body);

      const { extraction, inputTokens, outputTokens, latencyMs } =
        await ocrService.extractFromImage(imageBase64, mediaType);

      const success = extraction.confidence > 0;
      await ocrService.logAiCall(
        userId,
        'OCR_EXTRACTION',
        { input: inputTokens, output: outputTokens },
        latencyMs,
        success
      );

      // Increment usage counter
      await fastify.prisma.user.update({
        where: { id: userId },
        data: { ocrUsedThisMonth: { increment: 1 } },
      });

      reply.send({ extraction, confidence: extraction.confidence });
    },
  });

  // POST /api/ocr/risk-audit
  fastify.post('/risk-audit', {
    schema: { tags: ['ocr'], summary: 'Ocena ryzyka podatkowego wydatku (Premium)' },
    handler: async (request, reply) => {
      const userId = request.user.sub;

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
          message: 'Pre-Audyt AI dostępny w planie Premium',
        });
        return;
      }

      const profile = await fastify.prisma.jDGProfile.findUnique({
        where: { userId },
        select: { taxForm: true },
      });

      const { extraction, confirmedCategory } = RiskAuditRequestSchema.parse(request.body);

      const { audit, inputTokens, outputTokens, latencyMs } = await ocrService.assessTaxRisk(
        extraction,
        profile?.taxForm ?? 'SCALE',
        confirmedCategory
      );

      await ocrService.logAiCall(
        userId,
        'OCR_RISK_AUDIT',
        { input: inputTokens, output: outputTokens },
        latencyMs,
        true
      );

      reply.send({ audit });
    },
  });

  // POST /api/ocr/save-cost
  fastify.post('/save-cost', {
    schema: { tags: ['ocr'], summary: 'Zapisz koszt z danych OCR' },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const input = SaveCostFromOcrSchema.parse(request.body);

      const cost = await fastify.prisma.cost.create({
        data: {
          userId,
          amount: input.confirmedAmount,
          currency: 'PLN',
          category: input.confirmedCategory as never,
          vendor: input.confirmedVendor,
          vendorNip: input.extraction.vendorNip ?? undefined,
          date: input.confirmedDate,
          receiptImageUrl: input.imageKey ?? undefined,
          aiRiskLevel: (input.riskAudit?.level as never) ?? undefined,
          aiRiskReason: input.riskAudit?.message ?? undefined,
          aiLegalBasis: input.riskAudit?.legalBasis ?? undefined,
          isDeductible: input.riskAudit?.level !== 'RED',
        },
      });

      reply.status(201).send({ cost });
    },
  });
};

export default ocrRoutes;
