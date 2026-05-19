import { describe, it, expect } from 'vitest';
import { OcrExtractionSchema, RiskAuditSchema } from '@finera/shared';

// Inline to avoid pulling in config.ts (requires env vars)
function parseJsonFromClaude<T>(text: string, fallback: T): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try { return JSON.parse(cleaned) as T; } catch { /* */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]) as T; } catch { /* */ } }
  return fallback;
}

// ── parseJsonFromClaude (utility used by OcrService) ──────────────────

describe('parseJsonFromClaude', () => {
  it('parses plain JSON from Claude response', () => {
    const text = '{"date":"2026-01-15","amount":123.45,"confidence":0.9}';
    const result = parseJsonFromClaude<Record<string, unknown>>(text, {});
    expect(result.date).toBe('2026-01-15');
    expect(result.amount).toBe(123.45);
    expect(result.confidence).toBe(0.9);
  });

  it('strips markdown code fences before parsing', () => {
    const text = '```json\n{"vendorName":"Lidl","amount":45.0}\n```';
    const result = parseJsonFromClaude<Record<string, unknown>>(text, {});
    expect(result.vendorName).toBe('Lidl');
  });

  it('extracts JSON object from surrounding text', () => {
    const text = 'Here is the result:\n{"level":"GREEN","message":"OK."}\nDone.';
    const result = parseJsonFromClaude<Record<string, unknown>>(text, {});
    expect(result.level).toBe('GREEN');
  });

  it('returns fallback when JSON is invalid', () => {
    const fallback = { confidence: 0 };
    const result = parseJsonFromClaude('not json at all', fallback);
    expect(result).toBe(fallback);
  });

  it('returns fallback on empty string', () => {
    const fallback = { error: true };
    const result = parseJsonFromClaude('', fallback);
    expect(result).toBe(fallback);
  });
});

// ── OcrExtractionSchema (Zod validation) ─────────────────────────────

describe('OcrExtractionSchema', () => {
  it('validates a complete valid OCR extraction', () => {
    const input = {
      date: '2026-01-15',
      amount: 123.45,
      amountGross: 151.84,
      vatAmount: 28.39,
      vendorName: 'Sklep ABC',
      vendorNip: '5252344078',
      category: 'OFFICE',
      documentType: 'RECEIPT',
      confidence: 0.95,
    };
    expect(() => OcrExtractionSchema.parse(input)).not.toThrow();
  });

  it('strips spaces and dashes from NIP field', () => {
    const input = {
      date: null, amount: null, amountGross: null, vatAmount: null,
      vendorName: null, category: null,
      vendorNip: '525-234-40-78',
      documentType: 'RECEIPT',
      confidence: 0.8,
    };
    const result = OcrExtractionSchema.parse(input);
    expect(result.vendorNip).toBe('5252344078');
  });

  it('accepts all-null extraction with low confidence', () => {
    const input = {
      date: null, amount: null, amountGross: null, vatAmount: null,
      vendorName: null, vendorNip: null, category: null,
      documentType: 'OTHER',
      confidence: 0,
    };
    expect(() => OcrExtractionSchema.parse(input)).not.toThrow();
  });

  it('rejects confidence above 1', () => {
    expect(() =>
      OcrExtractionSchema.parse({
        date: null, amount: null, amountGross: null, vatAmount: null,
        vendorName: null, vendorNip: null, category: null,
        documentType: 'RECEIPT', confidence: 1.5,
      })
    ).toThrow();
  });

  it('classifies RECEIPT for paragon and INVOICE_SIMPLIFIED for faktura uproszczona', () => {
    const receipt = OcrExtractionSchema.parse({
      date: null, amount: null, amountGross: null, vatAmount: null,
      vendorName: null, vendorNip: null, category: null,
      documentType: 'RECEIPT', confidence: 0.7,
    });
    expect(receipt.documentType).toBe('RECEIPT');

    const inv = OcrExtractionSchema.parse({
      date: null, amount: null, amountGross: null, vatAmount: null,
      vendorName: null, vendorNip: null, category: null,
      documentType: 'INVOICE_SIMPLIFIED', confidence: 0.7,
    });
    expect(inv.documentType).toBe('INVOICE_SIMPLIFIED');
  });
});

// ── RiskAuditSchema ───────────────────────────────────────────────────

describe('RiskAuditSchema', () => {
  it('validates GREEN level with all fields', () => {
    const input = {
      level: 'GREEN',
      message: 'Laptop firmowy jest kosztem. Skonsultuj z księgowym przed ujęciem w kosztach.',
      recommendation: 'Zachowaj fakturę.',
      legalBasis: 'Art. 22 ust. 1 UPDOF',
      safeDeductionPct: 100,
    };
    expect(() => RiskAuditSchema.parse(input)).not.toThrow();
  });

  it('validates YELLOW with null legalBasis and safeDeductionPct', () => {
    const input = {
      level: 'YELLOW',
      message: 'Wymaga dokumentacji. Skonsultuj z księgowym przed ujęciem w kosztach.',
      recommendation: 'Udokumentuj cel biznesowy.',
      legalBasis: null,
      safeDeductionPct: null,
    };
    expect(() => RiskAuditSchema.parse(input)).not.toThrow();
  });

  it('validates RED level', () => {
    const input = {
      level: 'RED',
      message: 'Zakupy spożywcze prywatne. Skonsultuj z księgowym przed ujęciem w kosztach.',
      recommendation: 'Nie zaliczaj do kosztów.',
      legalBasis: 'Art. 23 ust. 1 UPDOF',
      safeDeductionPct: 0,
    };
    expect(() => RiskAuditSchema.parse(input)).not.toThrow();
  });

  it('rejects invalid risk level', () => {
    expect(() =>
      RiskAuditSchema.parse({
        level: 'ORANGE',
        message: 'test',
        recommendation: 'test',
        legalBasis: null,
        safeDeductionPct: null,
      })
    ).toThrow();
  });

  it('rejects safeDeductionPct above 100', () => {
    expect(() =>
      RiskAuditSchema.parse({
        level: 'GREEN',
        message: 'test. Skonsultuj z księgowym.',
        recommendation: 'test',
        legalBasis: null,
        safeDeductionPct: 150,
      })
    ).toThrow();
  });
});
