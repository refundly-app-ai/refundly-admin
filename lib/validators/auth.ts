import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const totpSchema = z.object({
  code: z.string().min(6, 'Código deve ter pelo menos 6 caracteres').max(12),
});

export const confirmTotpSchema = z.object({
  secret: z.string().min(16, 'Secret inválido'),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
  recoveryCodes: z.array(z.string()),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TOTPInput = z.infer<typeof totpSchema>;
export type ConfirmTOTPInput = z.infer<typeof confirmTotpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
