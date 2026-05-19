import { describe, it, expect } from 'vitest';
import {
  calculatePitAdvance,
  calculateVat,
  calculateZusHealth,
  calculateZusSocialMonthly,
  calculateTaxes,
  validateNip,
  formatPln,
  TAX_CONSTANTS,
} from '@finera/shared';

// ============================================================
// PIT calculations
// ============================================================

describe('calculatePitAdvance — Skala podatkowa', () => {
  it('zwraca 0 dla przychodu poniżej kwoty wolnej (30 000 PLN)', () => {
    expect(calculatePitAdvance(25_000, 'SCALE')).toBe(0);
  });

  it('oblicza podatek 12% dla przychodu w I progu (30 001 – 120 000)', () => {
    const income = 50_000;
    const expected = (income - 30_000) * 0.12;
    expect(calculatePitAdvance(income, 'SCALE')).toBeCloseTo(expected, 2);
  });

  it('oblicza podatek z dwoma progami dla przychodu powyżej 120 000 PLN', () => {
    const income = 150_000;
    const lowBracket = (120_000 - 30_000) * 0.12;
    const highBracket = (150_000 - 120_000) * 0.32;
    const expected = lowBracket + highBracket;
    expect(calculatePitAdvance(income, 'SCALE')).toBeCloseTo(expected, 2);
  });

  it('zwraca 0 dla ujemnego przychodu', () => {
    expect(calculatePitAdvance(-5_000, 'SCALE')).toBe(0);
  });
});

describe('calculatePitAdvance — Podatek liniowy 19%', () => {
  it('oblicza 19% od przychodu', () => {
    expect(calculatePitAdvance(100_000, 'LINEAR')).toBeCloseTo(19_000, 2);
  });

  it('oblicza poprawnie dla małego przychodu', () => {
    expect(calculatePitAdvance(10_000, 'LINEAR')).toBeCloseTo(1_900, 2);
  });

  it('zwraca 0 dla zerowego przychodu', () => {
    expect(calculatePitAdvance(0, 'LINEAR')).toBe(0);
  });
});

describe('calculatePitAdvance — Ryczałt', () => {
  it('stosuje stawkę 8.5% domyślnie', () => {
    expect(calculatePitAdvance(100_000, 'LUMP_SUM')).toBeCloseTo(8_500, 2);
  });

  it('stosuje podaną stawkę ryczałtu 15%', () => {
    expect(calculatePitAdvance(100_000, 'LUMP_SUM', 15)).toBeCloseTo(15_000, 2);
  });

  it('stosuje stawkę 3% dla niskich stawek ryczałtu', () => {
    expect(calculatePitAdvance(50_000, 'LUMP_SUM', 3)).toBeCloseTo(1_500, 2);
  });
});

// ============================================================
// VAT calculations
// ============================================================

describe('calculateVat', () => {
  it('oblicza VAT należny dla standardowego przypadku (23%)', () => {
    const grossIncome = 12_300;
    const grossCosts = 2_460;
    const vatFromSales = grossIncome - grossIncome / 1.23;
    const vatFromCosts = grossCosts - grossCosts / 1.23;
    const expected = vatFromSales - vatFromCosts;
    expect(calculateVat(grossIncome, 23, grossCosts, 23)).toBeCloseTo(expected, 2);
  });

  it('zwraca 0 gdy VAT od zakupów >= VAT od sprzedaży', () => {
    expect(calculateVat(1_000, 23, 50_000, 23)).toBe(0);
  });

  it('obsługuje stawkę 0%', () => {
    expect(calculateVat(10_000, 0, 5_000, 0)).toBe(0);
  });

  it('obsługuje stawkę 8%', () => {
    const vatFromSales = 10_000 - 10_000 / 1.08;
    const vatFromCosts = 5_000 - 5_000 / 1.08;
    expect(calculateVat(10_000, 8, 5_000, 8)).toBeCloseTo(vatFromSales - vatFromCosts, 2);
  });
});

// ============================================================
// ZUS calculations
// ============================================================

describe('calculateZusHealth', () => {
  it('nie jest niższy od minimalnej składki dla podatku liniowego', () => {
    const result = calculateZusHealth(1_000, 'LINEAR');
    expect(result).toBeGreaterThanOrEqual(TAX_CONSTANTS.ZUS_HEALTH_MIN_2026);
  });

  it('oblicza 4.9% od rocznego przychodu (podatek liniowy) dla dużego przychodu', () => {
    const annualIncome = 500_000;
    const expected = annualIncome * 0.049;
    expect(calculateZusHealth(annualIncome, 'LINEAR')).toBeCloseTo(expected, 2);
  });

  it('oblicza ryczałt dla przychodu <= 60 000 PLN', () => {
    expect(calculateZusHealth(50_000, 'LUMP_SUM')).toBe(419.46);
  });

  it('oblicza ryczałt dla przychodu 60 001 – 300 000 PLN', () => {
    expect(calculateZusHealth(100_000, 'LUMP_SUM')).toBe(699.11);
  });

  it('oblicza ryczałt dla przychodu > 300 000 PLN', () => {
    expect(calculateZusHealth(400_000, 'LUMP_SUM')).toBe(1_258.39);
  });
});

describe('calculateZusSocialMonthly', () => {
  it('zwraca wartość dodatnią', () => {
    expect(calculateZusSocialMonthly()).toBeGreaterThan(0);
  });

  it('oblicza na podstawie podstawy wymiaru 2026', () => {
    const base = TAX_CONSTANTS.ZUS_SOCIAL_BASE_2026;
    const totalRate =
      TAX_CONSTANTS.ZUS_SOCIAL_RETIREMENT_RATE +
      TAX_CONSTANTS.ZUS_SOCIAL_DISABILITY_RATE +
      TAX_CONSTANTS.ZUS_SOCIAL_SICKNESS_RATE +
      TAX_CONSTANTS.ZUS_SOCIAL_ACCIDENT_RATE +
      TAX_CONSTANTS.ZUS_LABOR_FUND_RATE;
    const expected = base * totalRate;
    expect(calculateZusSocialMonthly()).toBeCloseTo(expected, 2);
  });
});

// ============================================================
// Full tax calculation
// ============================================================

describe('calculateTaxes — pełna kalkulacja', () => {
  it('oblicza pełne zobowiązania dla płatnika VAT na skali podatkowej', () => {
    const result = calculateTaxes({
      revenue: 24_600,
      costs: 4_920,
      taxForm: 'SCALE',
      isVatPayer: true,
      vatRate: 23,
      month: 5,
      year: 2026,
    });

    expect(result.netRevenue).toBeCloseTo(20_000, 0);
    expect(result.vatOwed).toBeGreaterThan(0);
    expect(result.pitAmount).toBeGreaterThanOrEqual(0);
    expect(result.zusHealth).toBeGreaterThan(0);
    expect(result.zusSocial).toBeGreaterThan(0);
    expect(result.totalTaxBurden).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeLessThan(1);
    expect(result.breakdown.length).toBeGreaterThan(0);
  });

  it('zwraca 0 VAT dla niebędącego płatnikiem VAT', () => {
    const result = calculateTaxes({
      revenue: 10_000,
      costs: 2_000,
      taxForm: 'LINEAR',
      isVatPayer: false,
      vatRate: 23,
      month: 5,
      year: 2026,
    });
    expect(result.vatOwed).toBe(0);
  });

  it('podatek liniowy — wyższa stopa niż skala dla niskich dochodów', () => {
    const linearResult = calculateTaxes({
      revenue: 50_000,
      costs: 10_000,
      taxForm: 'LINEAR',
      isVatPayer: false,
      vatRate: 23,
      month: 5,
      year: 2026,
    });

    const scaleResult = calculateTaxes({
      revenue: 50_000,
      costs: 10_000,
      taxForm: 'SCALE',
      isVatPayer: false,
      vatRate: 23,
      month: 5,
      year: 2026,
    });

    // Linear always 19%, scale 0-12% in this range → linear > scale
    expect(linearResult.pitAmount).toBeGreaterThan(scaleResult.pitAmount);
  });

  it('brak odliczenia kosztów dla ryczałtu', () => {
    const result = calculateTaxes({
      revenue: 10_000,
      costs: 3_000,
      taxForm: 'LUMP_SUM',
      lumpSumRate: 8.5,
      isVatPayer: false,
      vatRate: 23,
      month: 5,
      year: 2026,
    });
    expect(result.deductibleCosts).toBe(0);
    expect(result.taxBase).toBe(result.netRevenue);
  });

  it('obsługuje zerowy przychód gracefully', () => {
    const result = calculateTaxes({
      revenue: 0,
      costs: 0,
      taxForm: 'SCALE',
      isVatPayer: true,
      vatRate: 23,
      month: 5,
      year: 2026,
    });
    expect(result.totalTaxBurden).toBeGreaterThan(0); // ZUS still due
    expect(result.effectiveTaxRate).toBe(0); // no revenue = 0% rate
  });
});

// ============================================================
// NIP validation
// ============================================================

describe('validateNip', () => {
  it('akceptuje prawidłowy NIP (5252344078 — Allegro PL)', () => {
    expect(validateNip('5252344078')).toBe(true);
  });

  it('akceptuje NIP z myślnikami (formatowany)', () => {
    expect(validateNip('525-234-40-78')).toBe(true);
  });

  it('odrzuca NIP z błędną sumą kontrolną', () => {
    expect(validateNip('1234567890')).toBe(false);
  });

  it('odrzuca NIP za krótki', () => {
    expect(validateNip('123456789')).toBe(false);
  });

  it('odrzuca NIP zawierający litery', () => {
    expect(validateNip('PL5252344078')).toBe(false);
  });
});

// ============================================================
// formatPln
// ============================================================

describe('formatPln', () => {
  it('formatuje kwotę z symbolem waluty (zł lub PLN zależnie od locale)', () => {
    const result = formatPln(1234.56);
    expect(result).toMatch(/1.*234/);
    // pl-PL locale uses 'zł', en-* uses 'PLN'
    expect(result).toMatch(/zł|PLN/);
  });

  it('formatuje zero', () => {
    const result = formatPln(0);
    expect(result).toContain('0');
  });

  it('formatuje ujemną kwotę', () => {
    const result = formatPln(-500);
    expect(result).toContain('500');
  });
});
