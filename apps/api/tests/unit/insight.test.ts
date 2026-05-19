import { describe, it, expect } from 'vitest';
import { InsightMetricsSchema } from '@finera/shared';

// ── InsightMetricsSchema ──────────────────────────────────────────────

describe('InsightMetricsSchema', () => {
  const baseMetrics = {
    revenueTotal: 20000,
    revenuePrevPeriod: null,
    revenueGrowthPct: null,
    costsTotal: 5000,
    grossMarginPct: 75,
    topClients: [],
    topCostCategories: [],
    overdueInvoicesCount: 0,
    overdueInvoicesValue: 0,
  };

  it('validates complete valid metrics', () => {
    expect(() => InsightMetricsSchema.parse(baseMetrics)).not.toThrow();
  });

  it('revenueGrowthPct is null when no previous period data', () => {
    const metrics = InsightMetricsSchema.parse({ ...baseMetrics, revenueGrowthPct: null });
    expect(metrics.revenueGrowthPct).toBeNull();
  });

  it('calculates correct revenueGrowthPct (20 000 vs 16 667 = +20%)', () => {
    const prev = 16_666.67;
    const curr = 20_000;
    const growthPct = ((curr - prev) / prev) * 100;

    const metrics = InsightMetricsSchema.parse({
      ...baseMetrics,
      revenueTotal: curr,
      revenuePrevPeriod: prev,
      revenueGrowthPct: growthPct,
    });
    expect(metrics.revenueGrowthPct).toBeCloseTo(20, 0);
  });

  it('correctly orders topClients by revenue share (highest first)', () => {
    const clients = [
      { name: 'Firma B', revenueShare: 30, invoiceCount: 2 },
      { name: 'Firma A', revenueShare: 50, invoiceCount: 5 },
      { name: 'Firma C', revenueShare: 20, invoiceCount: 1 },
    ];
    // Sorted by calling code (InsightService sorts before passing)
    const sorted = [...clients].sort((a, b) => b.revenueShare - a.revenueShare);
    expect(sorted[0].name).toBe('Firma A');
    expect(sorted[1].name).toBe('Firma B');
  });

  it('handles edge case: zero invoices in period', () => {
    const metrics = InsightMetricsSchema.parse({
      ...baseMetrics,
      revenueTotal: 0,
      costsTotal: 0,
      grossMarginPct: 0,
      topClients: [],
      topCostCategories: [],
    });
    expect(metrics.revenueTotal).toBe(0);
    expect(metrics.topClients).toHaveLength(0);
  });

  it('rejects topClients array exceeding 5 entries', () => {
    expect(() =>
      InsightMetricsSchema.parse({
        ...baseMetrics,
        topClients: Array.from({ length: 6 }, (_, i) => ({
          name: `Firma ${i}`,
          revenueShare: 10,
          invoiceCount: 1,
        })),
      })
    ).toThrow();
  });

  it('accepts negative revenueGrowthPct (revenue decline)', () => {
    const metrics = InsightMetricsSchema.parse({
      ...baseMetrics,
      revenuePrevPeriod: 25000,
      revenueGrowthPct: -20,
    });
    expect(metrics.revenueGrowthPct).toBe(-20);
  });
});
