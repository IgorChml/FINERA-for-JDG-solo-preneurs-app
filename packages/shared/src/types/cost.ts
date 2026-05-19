export type CostCategory =
  | 'OFFICE'
  | 'TRANSPORT'
  | 'MARKETING'
  | 'SOFTWARE'
  | 'HARDWARE'
  | 'PROFESSIONAL_SERVICES'
  | 'PHONE_INTERNET'
  | 'FOOD_BUSINESS'
  | 'TRAINING'
  | 'INSURANCE'
  | 'OTHER';

export type AiRiskLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface Cost {
  id: string;
  userId: string;
  invoiceId?: string;
  amount: number;
  vatAmount?: number;
  netAmount?: number;
  currency: string;
  category: CostCategory;
  vendor: string;
  vendorNip?: string;
  description?: string;
  date: Date;
  receiptImageUrl?: string;
  aiRiskLevel?: AiRiskLevel;
  aiRiskReason?: string;
  aiLegalBasis?: string;
  isDeductible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCostDto {
  amount: number;
  currency?: string;
  category: CostCategory;
  vendor: string;
  vendorNip?: string;
  description?: string;
  date: Date;
  receiptImageUrl?: string;
}

export interface OcrResult {
  vendor?: string;
  vendorNip?: string;
  amount?: number;
  vatAmount?: number;
  date?: Date;
  category?: CostCategory;
  confidence: number;
}

export interface AiAuditResult {
  riskLevel: AiRiskLevel;
  reason: string;
  legalBasis: string;
  recommendation: string;
}
