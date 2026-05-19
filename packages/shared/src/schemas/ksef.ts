import { z } from 'zod';

export const KSeFTokenSchema = z.object({
  token: z.string().min(32, 'Token KSeF musi mieć co najmniej 32 znaki'),
  environment: z.enum(['DEMO', 'PRODUCTION']).default('DEMO'),
});

export const KSeFSyncParamsSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  type: z.enum(['INCOME', 'COST', 'ALL']).default('ALL'),
});

export type KSeFTokenInput = z.infer<typeof KSeFTokenSchema>;
export type KSeFSyncParamsInput = z.infer<typeof KSeFSyncParamsSchema>;
