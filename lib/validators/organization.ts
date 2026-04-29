import { z } from 'zod';

export const suspendOrgSchema = z.object({
  confirmSlug: z.string().min(1, 'Slug de confirmação é obrigatório'),
  reason: z.string().min(1, 'Motivo é obrigatório'),
});

export const changePlanSchema = z.object({
  newPlan: z.enum(['free', 'basic', 'pro'], {
    errorMap: () => ({ message: 'Plano inválido' }),
  }),
  confirmSlug: z.string().min(1, 'Slug de confirmação é obrigatório'),
});

export const orgFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'suspended', 'blocked', 'churned']).optional(),
  plan: z.enum(['free', 'basic', 'pro']).optional(),
  healthBucket: z.string().optional(),
});

export type SuspendOrgInput = z.infer<typeof suspendOrgSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
export type OrgFiltersInput = z.infer<typeof orgFiltersSchema>;
