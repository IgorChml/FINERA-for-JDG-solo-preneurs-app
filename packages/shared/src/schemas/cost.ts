import { z } from 'zod';

export const CostCategoryEnum = z.enum([
  'OFFICE',
  'TRANSPORT',
  'MARKETING',
  'SOFTWARE',
  'HARDWARE',
  'PROFESSIONAL_SERVICES',
  'PHONE_INTERNET',
  'FOOD_BUSINESS',
  'TRAINING',
  'INSURANCE',
  'OTHER',
]);

export const CreateCostSchema = z.object({
  amount: z.number().positive('Kwota musi być dodatnia'),
  currency: z.string().length(3).default('PLN'),
  category: CostCategoryEnum,
  vendor: z.string().min(2, 'Sprzedawca jest wymagany'),
  vendorNip: z
    .string()
    .regex(/^\d{10}$/, 'NIP musi mieć 10 cyfr')
    .optional(),
  description: z.string().max(500).optional(),
  date: z.coerce.date(),
  receiptImageUrl: z.string().url().optional(),
});

export const OcrScanSchema = z.object({
  imageBase64: z.string().min(1, 'Obraz jest wymagany'),
  imageType: z.enum(['jpeg', 'png', 'webp']).default('jpeg'),
});

export type CreateCostInput = z.infer<typeof CreateCostSchema>;
export type OcrScanInput = z.infer<typeof OcrScanSchema>;
