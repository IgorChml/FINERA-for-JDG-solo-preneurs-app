import type { TaxForm } from './user';

export interface TaxReserve {
  id: string;
  userId: string;
  month: number;
  year: number;
  revenue: number;
  costs: number;
  vatOwed: number;
  pitOwed: number;
  zusHealthOwed: number;
  zusSocialOwed: number;
  totalOwed: number;
  reservedAmount: number;
  isPaid: boolean;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxCalculationInput {
  revenue: number;
  costs: number;
  taxForm: TaxForm;
  lumpSumRate?: number;
  isVatPayer: boolean;
  vatRate: number;
  month: number;
  year: number;
}

export interface TaxCalculationResult {
  netRevenue: number;
  deductibleCosts: number;
  taxBase: number;
  pitAmount: number;
  vatOwed: number;
  zusHealth: number;
  zusSocial: number;
  totalTaxBurden: number;
  effectiveTaxRate: number;
  breakdown: TaxBreakdownItem[];
}

export interface TaxBreakdownItem {
  label: string;
  amount: number;
  dueDate?: Date;
  microaccountType?: 'PIT' | 'VAT' | 'ZUS_HEALTH' | 'ZUS_SOCIAL';
}

export interface PaymentQrData {
  recipient: string;
  accountNumber: string;
  amount: number;
  title: string;
  currency: string;
}

export type ZusVariant = 'STARTUP' | 'REGULAR' | 'PREFERENTIAL';

export interface ZusRates {
  variant: ZusVariant;
  social: number;
  health: number;
  sicknessFund?: number;
  accidentFund?: number;
  laborFund?: number;
  solidarityFund?: number;
  total: number;
  year: number;
}
