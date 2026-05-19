import { TAX_CONSTANTS } from '../constants';
import type { TaxCalculationInput, TaxCalculationResult, TaxBreakdownItem } from '../types/tax';
import type { TaxForm } from '../types/user';

/**
 * Calculates VAT owed for the period.
 * VAT = sum(gross_income * vatRate) - sum(gross_costs * vatRate)
 */
export function calculateVat(
  grossIncome: number,
  vatRateIncome: number,
  grossCosts: number,
  vatRateCosts: number
): number {
  const vatFromSales = grossIncome - grossIncome / (1 + vatRateIncome / 100);
  const vatFromCosts = grossCosts - grossCosts / (1 + vatRateCosts / 100);
  return Math.max(0, vatFromSales - vatFromCosts);
}

/**
 * Calculates PIT advance payment based on tax form.
 */
export function calculatePitAdvance(
  taxableIncome: number,
  taxForm: TaxForm,
  lumpSumRate?: number
): number {
  if (taxableIncome <= 0) return 0;

  switch (taxForm) {
    case 'LINEAR':
      return Math.max(0, taxableIncome * TAX_CONSTANTS.PIT_LINEAR_RATE);

    case 'LUMP_SUM': {
      const rate = (lumpSumRate ?? 8.5) / 100;
      return Math.max(0, taxableIncome * rate);
    }

    case 'SCALE': {
      const freeAmount = TAX_CONSTANTS.PIT_FREE_AMOUNT;
      const threshold = TAX_CONSTANTS.PIT_SCALE_THRESHOLD;

      if (taxableIncome <= freeAmount) return 0;

      const taxableAfterFree = taxableIncome - freeAmount;

      if (taxableAfterFree <= threshold - freeAmount) {
        return taxableAfterFree * TAX_CONSTANTS.PIT_SCALE_RATE_LOW;
      }

      const lowBracket = (threshold - freeAmount) * TAX_CONSTANTS.PIT_SCALE_RATE_LOW;
      const highBracket =
        (taxableAfterFree - (threshold - freeAmount)) * TAX_CONSTANTS.PIT_SCALE_RATE_HIGH;
      return lowBracket + highBracket;
    }

    default:
      return 0;
  }
}

/**
 * Calculates ZUS health contribution.
 * Formula differs based on tax form in 2026.
 */
export function calculateZusHealth(annualIncome: number, taxForm: TaxForm): number {
  const minContribution = TAX_CONSTANTS.ZUS_HEALTH_MIN_2026;

  switch (taxForm) {
    case 'LINEAR': {
      const calculated = annualIncome * TAX_CONSTANTS.ZUS_HEALTH_RATE_LINEAR;
      return Math.max(minContribution, calculated);
    }
    case 'SCALE': {
      const calculated = annualIncome * TAX_CONSTANTS.ZUS_HEALTH_RATE_SCALE;
      return Math.max(minContribution, calculated);
    }
    case 'LUMP_SUM': {
      // Ryczałt: stała składka zależna od progu przychodu
      if (annualIncome <= 60_000) return 419.46;
      if (annualIncome <= 300_000) return 699.11;
      return 1_258.39;
    }
    default:
      return minContribution;
  }
}

/**
 * Calculates monthly ZUS social contribution (regular variant).
 */
export function calculateZusSocialMonthly(): number {
  const base = TAX_CONSTANTS.ZUS_SOCIAL_BASE_2026;
  return (
    base *
    (TAX_CONSTANTS.ZUS_SOCIAL_RETIREMENT_RATE +
      TAX_CONSTANTS.ZUS_SOCIAL_DISABILITY_RATE +
      TAX_CONSTANTS.ZUS_SOCIAL_SICKNESS_RATE +
      TAX_CONSTANTS.ZUS_SOCIAL_ACCIDENT_RATE +
      TAX_CONSTANTS.ZUS_LABOR_FUND_RATE)
  );
}

/**
 * Full tax calculation for a given period.
 */
export function calculateTaxes(input: TaxCalculationInput): TaxCalculationResult {
  const { revenue, costs, taxForm, lumpSumRate, isVatPayer, vatRate } = input;

  const netRevenue = isVatPayer ? revenue / (1 + vatRate / 100) : revenue;
  const deductibleCosts = taxForm === 'LUMP_SUM' ? 0 : costs;
  const taxBase = Math.max(0, netRevenue - deductibleCosts);

  const revenueForLumpSum = taxForm === 'LUMP_SUM' ? netRevenue : taxBase;
  const pitAmount = calculatePitAdvance(revenueForLumpSum, taxForm, lumpSumRate);

  const vatOwed = isVatPayer ? calculateVat(revenue, vatRate, costs, vatRate) : 0;

  const annualizedIncome = taxBase * 12;
  const zusHealthMonthly = calculateZusHealth(annualizedIncome, taxForm) / 12;
  const zusSocialMonthly = calculateZusSocialMonthly();

  const totalTaxBurden = pitAmount + vatOwed + zusHealthMonthly + zusSocialMonthly;
  const effectiveTaxRate = netRevenue > 0 ? totalTaxBurden / netRevenue : 0;

  const breakdown: TaxBreakdownItem[] = [
    {
      label: 'Zaliczka PIT',
      amount: pitAmount,
      microaccountType: 'PIT',
    },
    ...(isVatPayer
      ? [
          {
            label: 'VAT do zapłaty',
            amount: vatOwed,
            microaccountType: 'VAT' as const,
          },
        ]
      : []),
    {
      label: 'Składka zdrowotna ZUS',
      amount: zusHealthMonthly,
      microaccountType: 'ZUS_HEALTH',
    },
    {
      label: 'Składki społeczne ZUS',
      amount: zusSocialMonthly,
      microaccountType: 'ZUS_SOCIAL',
    },
  ];

  return {
    netRevenue,
    deductibleCosts,
    taxBase,
    pitAmount,
    vatOwed,
    zusHealth: zusHealthMonthly,
    zusSocial: zusSocialMonthly,
    totalTaxBurden,
    effectiveTaxRate,
    breakdown,
  };
}

/**
 * Validates NIP (Polish tax ID) with checksum algorithm.
 */
export function validateNip(nip: string): boolean {
  const normalized = nip.replace(/[-\s]/g, '');
  if (!/^\d{10}$/.test(normalized)) return false;

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const digits = normalized.split('').map(Number);
  const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
  return sum % 11 === digits[9];
}

/**
 * Formats PLN amount for display.
 */
export function formatPln(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
