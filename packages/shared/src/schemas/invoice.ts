import { z } from 'zod';

export const InvoiceItemSchema = z.object({
  name: z.string().min(1, 'Nazwa pozycji jest wymagana'),
  quantity: z.number().positive('Ilość musi być dodatnia'),
  unitPrice: z.number().min(0, 'Cena jednostkowa nie może być ujemna'),
  vatRate: z.union([z.literal(0), z.literal(5), z.literal(8), z.literal(23)]),
  unit: z.string().optional().default('szt'),
});

export const CreateInvoiceSchema = z.object({
  type: z.enum(['INCOME', 'COST']),
  buyerName: z.string().min(2, 'Nazwa nabywcy jest wymagana'),
  buyerNip: z
    .string()
    .regex(/^\d{10}$/, 'NIP musi mieć 10 cyfr')
    .optional(),
  buyerAddress: z.string().optional(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  items: z.array(InvoiceItemSchema).min(1, 'Faktura musi mieć co najmniej jedną pozycję'),
  currency: z.string().length(3).default('PLN'),
  notes: z.string().max(500).optional(),
});

export const InvoiceListParamsSchema = z.object({
  type: z.enum(['INCOME', 'COST']).optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

export const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
  paymentDate: z.coerce.date().optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type InvoiceListParamsInput = z.infer<typeof InvoiceListParamsSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof UpdateInvoiceStatusSchema>;
