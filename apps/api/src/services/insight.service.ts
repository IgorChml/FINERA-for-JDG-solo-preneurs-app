import type { FastifyInstance } from 'fastify';
import { callClaude, extractText } from '../ai/claude.client.js';
import {
  INSIGHT_NARRATIVE_SYSTEM,
  INSIGHT_NARRATIVE_USER_TEMPLATE,
} from '../ai/prompts/insight-narrative.prompt.js';
import { InsightMetricsSchema, type InsightMetrics, type InsightReportResponse } from '@finera/shared';
import { COST_CATEGORY_LABELS } from '@finera/shared';

type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
}

function parsePeriodRange(period: string, periodType: PeriodType): DateRange {
  if (periodType === 'MONTHLY') {
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59);
    const label = `${month.toString().padStart(2, '0')}/${year}`;
    return { start, end, prevStart, prevEnd, label };
  }

  if (periodType === 'QUARTERLY') {
    const [year, q] = period.split('-Q').map(Number);
    const qStart = (q - 1) * 3;
    const start = new Date(year, qStart, 1);
    const end = new Date(year, qStart + 3, 0, 23, 59, 59);
    const prevQStart = qStart - 3;
    const prevStart = prevQStart >= 0 ? new Date(year, prevQStart, 1) : new Date(year - 1, 9, 1);
    const prevEnd = prevQStart >= 0
      ? new Date(year, prevQStart + 3, 0, 23, 59, 59)
      : new Date(year - 1, 12, 0, 23, 59, 59);
    return { start, end, prevStart, prevEnd, label: `Q${q} ${year}` };
  }

  // YEARLY
  const year = parseInt(period, 10);
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);
  const prevStart = new Date(year - 1, 0, 1);
  const prevEnd = new Date(year - 1, 11, 31, 23, 59, 59);
  return { start, end, prevStart, prevEnd, label: String(year) };
}

export class InsightService {
  constructor(private readonly fastify: FastifyInstance) {}

  async generateOrGetCached(
    userId: string,
    period: string,
    periodType: PeriodType
  ): Promise<InsightReportResponse> {
    const { prisma } = this.fastify;

    // Check cache first
    const cached = await prisma.insightReport.findFirst({
      where: {
        userId,
        period,
        periodType,
        cachedUntil: { gt: new Date() },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (cached) {
      return {
        id: cached.id,
        period: cached.period,
        periodType: cached.periodType,
        generatedAt: cached.generatedAt.toISOString(),
        narrative: cached.narrative,
        metrics: cached.metrics as InsightMetrics,
        isCached: true,
      };
    }

    // Generate fresh report
    const metrics = await this.calculateMetrics(userId, period, periodType);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    const narrative = await this.generateNarrative(
      metrics,
      parsePeriodRange(period, periodType).label,
      user?.firstName ?? 'użytkowniku'
    );

    const cachedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const report = await prisma.insightReport.create({
      data: {
        userId,
        period,
        periodType,
        cachedUntil,
        narrative,
        metrics: metrics as never,
        promptVersion: 'insight-v1',
        tokensUsed: 0,
      },
    });

    return {
      id: report.id,
      period: report.period,
      periodType: report.periodType,
      generatedAt: report.generatedAt.toISOString(),
      narrative: report.narrative,
      metrics,
      isCached: false,
    };
  }

  async rateReport(reportId: string, userId: string, rating: 1 | -1): Promise<void> {
    await this.fastify.prisma.insightReport.updateMany({
      where: { id: reportId, userId },
      data: { userRating: rating },
    });
  }

  // Pure TypeScript — zero Claude calls
  private async calculateMetrics(
    userId: string,
    period: string,
    periodType: PeriodType
  ): Promise<InsightMetrics> {
    const { prisma } = this.fastify;
    const range = parsePeriodRange(period, periodType);

    const [invoices, prevInvoices, costs] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId,
          type: 'INCOME',
          issueDate: { gte: range.start, lte: range.end },
          status: { not: 'CANCELLED' },
        },
        select: { grossAmount: true, buyerName: true },
      }),
      prisma.invoice.findMany({
        where: {
          userId,
          type: 'INCOME',
          issueDate: { gte: range.prevStart, lte: range.prevEnd },
          status: { not: 'CANCELLED' },
        },
        select: { grossAmount: true },
      }),
      prisma.cost.findMany({
        where: { userId, date: { gte: range.start, lte: range.end } },
        select: { amount: true, category: true },
      }),
    ]);

    const revenueTotal = invoices.reduce((s, i) => s + Number(i.grossAmount), 0);
    const revenuePrevPeriod =
      prevInvoices.length > 0
        ? prevInvoices.reduce((s, i) => s + Number(i.grossAmount), 0)
        : null;
    const revenueGrowthPct =
      revenuePrevPeriod !== null && revenuePrevPeriod > 0
        ? ((revenueTotal - revenuePrevPeriod) / revenuePrevPeriod) * 100
        : null;

    const costsTotal = costs.reduce((s, c) => s + Number(c.amount), 0);
    const grossMarginPct = revenueTotal > 0
      ? ((revenueTotal - costsTotal) / revenueTotal) * 100
      : 0;

    // Top clients by revenue share
    const clientMap = new Map<string, { revenue: number; count: number }>();
    for (const inv of invoices) {
      const name = inv.buyerName;
      const existing = clientMap.get(name) ?? { revenue: 0, count: 0 };
      clientMap.set(name, {
        revenue: existing.revenue + Number(inv.grossAmount),
        count: existing.count + 1,
      });
    }
    const topClients = [...clientMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        revenueShare: revenueTotal > 0 ? (data.revenue / revenueTotal) * 100 : 0,
        invoiceCount: data.count,
      }));

    // Top cost categories
    const catMap = new Map<string, number>();
    for (const cost of costs) {
      catMap.set(cost.category, (catMap.get(cost.category) ?? 0) + Number(cost.amount));
    }
    const topCostCategories = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category: COST_CATEGORY_LABELS[category] ?? category,
        amount,
        share: costsTotal > 0 ? (amount / costsTotal) * 100 : 0,
      }));

    // Overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      select: { grossAmount: true },
    });
    const overdueInvoicesCount = overdueInvoices.length;
    const overdueInvoicesValue = overdueInvoices.reduce((s, i) => s + Number(i.grossAmount), 0);

    return InsightMetricsSchema.parse({
      revenueTotal,
      revenuePrevPeriod,
      revenueGrowthPct,
      costsTotal,
      grossMarginPct,
      topClients,
      topCostCategories,
      overdueInvoicesCount,
      overdueInvoicesValue,
    });
  }

  private async generateNarrative(
    metrics: InsightMetrics,
    period: string,
    userName: string
  ): Promise<string> {
    try {
      const result = await callClaude({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: INSIGHT_NARRATIVE_SYSTEM,
        messages: [
          {
            role: 'user',
            content: INSIGHT_NARRATIVE_USER_TEMPLATE(
              JSON.stringify(metrics, null, 2),
              period,
              userName
            ),
          },
        ],
      });

      const text = extractText(result.message).trim();
      if (!text) throw new Error('Empty narrative');
      return text;
    } catch {
      // Fallback narrative — no AI jargon about taxes
      const growth =
        metrics.revenueGrowthPct !== null
          ? ` To ${metrics.revenueGrowthPct > 0 ? '+' : ''}${metrics.revenueGrowthPct.toFixed(1)}% względem poprzedniego okresu.`
          : '';
      return (
        `W tym okresie Twoja firma wygenerowała ${metrics.revenueTotal.toLocaleString('pl-PL')} zł przychodów.` +
        growth +
        ` Marża brutto wyniosła ${metrics.grossMarginPct.toFixed(1)}%.` +
        (metrics.overdueInvoicesCount > 0
          ? ` Masz ${metrics.overdueInvoicesCount} przeterminowanych faktur na łączną kwotę ${metrics.overdueInvoicesValue.toLocaleString('pl-PL')} zł.`
          : '')
      );
    }
  }
}
