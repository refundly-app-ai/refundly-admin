import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type ChurnLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface OnboardingOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  onboardingStatus: string | null;
  onboardingCompletedAt: string | null;
  hasFirstMember: boolean;
  hasFirstExpense: boolean;
  hasIntegration: boolean;
  hasApprovalFlow: boolean;
  hasAdminLogin: boolean;
  completedSteps: number;
  totalSteps: number;
  completionPct: number;
  daysSinceCreation: number;
  daysSinceLastAdminLogin: number | null;
  healthScore: number;
  churnLevel: ChurnLevel;
  churnReason: string;
}

function calcChurnLevel(
  completionPct: number,
  daysSinceCreation: number,
  daysSinceLastAdminLogin: number | null,
  healthScore: number
): { level: ChurnLevel; reason: string } {
  if (completionPct === 0 && daysSinceCreation >= 7) {
    return { level: 'red', reason: 'Nenhum passo do onboarding concluído após 7+ dias' };
  }
  if (daysSinceLastAdminLogin !== null && daysSinceLastAdminLogin >= 30) {
    return { level: 'red', reason: `Sem acesso do admin há ${daysSinceLastAdminLogin} dias` };
  }
  if (healthScore < 20) {
    return { level: 'red', reason: 'Health score crítico (< 20)' };
  }
  if (completionPct < 40 && daysSinceCreation >= 5) {
    return { level: 'orange', reason: 'Onboarding < 40% após 5+ dias' };
  }
  if (daysSinceLastAdminLogin !== null && daysSinceLastAdminLogin >= 14) {
    return { level: 'orange', reason: `Sem acesso do admin há ${daysSinceLastAdminLogin} dias` };
  }
  if (healthScore < 40) {
    return { level: 'orange', reason: 'Health score baixo (< 40)' };
  }
  if (completionPct < 70) {
    return { level: 'yellow', reason: 'Onboarding incompleto (< 70%)' };
  }
  if (daysSinceLastAdminLogin !== null && daysSinceLastAdminLogin >= 7) {
    return { level: 'yellow', reason: `Admin inativo há ${daysSinceLastAdminLogin} dias` };
  }
  if (healthScore < 60) {
    return { level: 'yellow', reason: 'Health score moderado (< 60)' };
  }
  return { level: 'green', reason: 'Onboarding saudável' };
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.rpc('superadmin_onboarding');

    if (error) {
      console.error('Onboarding RPC error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const now = Date.now();

    type OnboardingRow = {
      id: string;
      name: string;
      slug: string;
      billing_status: string | null;
      created_at: string;
      lifecycle_health_score: number | null;
      last_admin_login_at: string | null;
      onboarding_status: string | null;
      onboarding_completed_at: string | null;
      has_admin_login: boolean;
      has_first_member: boolean;
      has_first_expense: boolean;
      has_integration: boolean;
      has_approval_flow: boolean;
    };
    const result: OnboardingOrg[] = ((data ?? []) as OnboardingRow[]).map((row) => {
      const hasFirstMember = Boolean(row.has_first_member);
      const hasFirstExpense = Boolean(row.has_first_expense);
      const hasIntegration = Boolean(row.has_integration);
      const hasApprovalFlow = Boolean(row.has_approval_flow);
      const hasAdminLogin = Boolean(row.has_admin_login);

      const steps = [hasFirstMember, hasFirstExpense, hasIntegration, hasApprovalFlow, hasAdminLogin];
      const totalSteps = steps.length;
      const completedSteps = steps.filter(Boolean).length;
      const completionPct = Math.round((completedSteps / totalSteps) * 100);

      const daysSinceCreation = Math.floor(
        (now - new Date(row.created_at).getTime()) / 86_400_000
      );
      const daysSinceLastAdminLogin = row.last_admin_login_at
        ? Math.floor((now - new Date(row.last_admin_login_at).getTime()) / 86_400_000)
        : null;

      const healthScore = Number(row.lifecycle_health_score ?? 0);

      const { level: churnLevel, reason: churnReason } = calcChurnLevel(
        completionPct,
        daysSinceCreation,
        daysSinceLastAdminLogin,
        healthScore
      );

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        plan: row.billing_status ?? 'free',
        createdAt: row.created_at,
        onboardingStatus: row.onboarding_status ?? null,
        onboardingCompletedAt: row.onboarding_completed_at ?? null,
        hasFirstMember,
        hasFirstExpense,
        hasIntegration,
        hasApprovalFlow,
        hasAdminLogin,
        completedSteps,
        totalSteps,
        completionPct,
        daysSinceCreation,
        daysSinceLastAdminLogin,
        healthScore,
        churnLevel,
        churnReason,
      };
    });

    const summary = {
      total: result.length,
      green: result.filter((o) => o.churnLevel === 'green').length,
      yellow: result.filter((o) => o.churnLevel === 'yellow').length,
      orange: result.filter((o) => o.churnLevel === 'orange').length,
      red: result.filter((o) => o.churnLevel === 'red').length,
      avgCompletion: result.length
        ? Math.round(result.reduce((s, o) => s + o.completionPct, 0) / result.length)
        : 0,
    };

    return NextResponse.json({ ok: true, data: { orgs: result, summary } });
  } catch (error) {
    console.error('Onboarding route error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
