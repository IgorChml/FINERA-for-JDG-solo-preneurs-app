import { z } from 'zod';

export const InsightMetricsSchema = z.object({
  revenueTotal: z.number(),
  revenuePrevPeriod: z.number().nullable(),
  revenueGrowthPct: z.number().nullable(),
  costsTotal: z.number(),
  grossMarginPct: z.number(),
  topClients: z
    .array(
      z.object({
        name: z.string(),
        revenueShare: z.number(),
        invoiceCount: z.number(),
      })
    )
    .max(5),
  topCostCategories: z
    .array(
      z.object({
        category: z.string(),
        amount: z.number(),
        share: z.number(),
      })
    )
    .max(5),
  overdueInvoicesCount: z.number(),
  overdueInvoicesValue: z.number(),
});

export const InsightReportResponseSchema = z.object({
  id: z.string(),
  period: z.string(),
  periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  generatedAt: z.string().datetime(),
  narrative: z.string(),
  metrics: InsightMetricsSchema,
  isCached: z.boolean(),
});

export const InsightRatingSchema = z.object({
  rating: z.union([z.literal(1), z.literal(-1)]),
});

export type InsightMetrics = z.infer<typeof InsightMetricsSchema>;
export type InsightReportResponse = z.infer<typeof InsightReportResponseSchema>;
export type InsightRatingInput = z.infer<typeof InsightRatingSchema>;
