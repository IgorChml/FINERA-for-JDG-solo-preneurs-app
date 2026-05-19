import { z } from 'zod';

const NIPRegex = /^\d{10}$/;
const PostalCodeRegex = /^\d{2}-\d{3}$/;

export const AddressSchema = z.object({
  street: z.string().min(2, 'Ulica jest wymagana'),
  houseNumber: z.string().min(1, 'Numer domu jest wymagany'),
  apartmentNumber: z.string().optional(),
  postalCode: z.string().regex(PostalCodeRegex, 'Nieprawidłowy kod pocztowy (format: 00-000)'),
  city: z.string().min(2, 'Miasto jest wymagane'),
  country: z.string().default('PL'),
});

export const JDGProfileSchema = z.object({
  companyName: z.string().min(2, 'Nazwa firmy jest wymagana').max(200),
  nip: z.string().regex(NIPRegex, 'NIP musi mieć dokładnie 10 cyfr'),
  regon: z.string().regex(/^\d{9}(\d{5})?$/, 'Nieprawidłowy REGON').optional(),
  pkdCode: z.string().regex(/^\d{2}\.\d{2}\.[A-Z]$/, 'Nieprawidłowy kod PKD').optional(),
  taxForm: z.enum(['SCALE', 'LINEAR', 'LUMP_SUM']),
  vatRate: z.union([z.literal(0), z.literal(5), z.literal(8), z.literal(23)]),
  isVatPayer: z.boolean(),
  lumpSumRate: z.number().min(2).max(17).optional(),
  address: AddressSchema,
  bankAccountNumber: z
    .string()
    .regex(/^PL\d{26}$|^\d{26}$/, 'Nieprawidłowy numer konta')
    .optional(),
  taxMicroaccountNumber: z
    .string()
    .regex(/^\d{26}$/, 'Nieprawidłowy numer mikrorachunku')
    .optional(),
});

export const UpdateProfileSchema = JDGProfileSchema.partial();

export type JDGProfileInput = z.infer<typeof JDGProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
