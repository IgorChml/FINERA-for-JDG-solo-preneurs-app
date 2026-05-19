import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę'),
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki').max(50),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki').max(50),
});

export const LoginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
