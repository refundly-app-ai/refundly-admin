import { z } from 'zod';

export const banMemberSchema = z.object({
  reason: z.string().min(1, 'Motivo é obrigatório'),
});

export const memberFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['admin', 'approver', 'member']).optional(),
  banned: z.boolean().optional(),
  neverLoggedIn: z.boolean().optional(),
});

export const inviteAdminSchema = z.object({
  email: z.string().email('E-mail inválido'),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

export type BanMemberInput = z.infer<typeof banMemberSchema>;
export type MemberFiltersInput = z.infer<typeof memberFiltersSchema>;
export type InviteAdminInput = z.infer<typeof inviteAdminSchema>;
