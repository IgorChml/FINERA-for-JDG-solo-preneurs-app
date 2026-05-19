import { z } from 'zod';

export const OcrExtractionSchema = z.object({
  date: z.string().nullable(),
  amount: z.number().nullable(),
  amountGross: z.number().nullable(),
  vatAmount: z.number().nullable(),
  vendorName: z.string().nullable(),
  vendorNip: z
    .string()
    .nullable()
    .transform((v) => (v ? v.replace(/[-\s]/g, '') : v)),
  category: z.string().nullable(),
  documentType: z.enum(['RECEIPT', 'INVOICE_SIMPLIFIED', 'INVOICE_FULL', 'OTHER']),
  confidence: z.number().min(0).max(1),
});

export const RiskAuditSchema = z.object({
  level: z.enum(['GREEN', 'YELLOW', 'RED']),
  message: z.string(),
  recommendation: z.string(),
  legalBasis: z.string().nullable(),
  safeDeductionPct: z.number().min(0).max(100).nullable(),
});

export const OcrScanRequestSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
});

export const RiskAuditRequestSchema = z.object({
  extraction: OcrExtractionSchema,
  confirmedCategory: z.string().min(1),
});

export const SaveCostFromOcrSchema = z.object({
  extraction: OcrExtractionSchema,
  riskAudit: RiskAuditSchema.optional(),
  imageKey: z.string().optional(),
  confirmedCategory: z.string(),
  confirmedVendor: z.string(),
  confirmedAmount: z.number().positive(),
  confirmedDate: z.coerce.date(),
});

export type OcrExtraction = z.infer<typeof OcrExtractionSchema>;
export type RiskAudit = z.infer<typeof RiskAuditSchema>;
export type OcrScanRequest = z.infer<typeof OcrScanRequestSchema>;
export type RiskAuditRequest = z.infer<typeof RiskAuditRequestSchema>;
export type SaveCostFromOcrInput = z.infer<typeof SaveCostFromOcrSchema>;
