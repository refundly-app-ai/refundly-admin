import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.rpc('superadmin_billing');

    if (error) {
      console.error('Get billing error:', error);
      return NextResponse.json({ ok: false, error: 'Erro ao buscar dados de faturamento' }, { status: 500 });
    }

    const metrics = data?.metrics ?? {};
    const mrr = Number(metrics.total_mrr ?? 0);
    const activeOrgs = Number(metrics.active_orgs ?? 0);
    const totalOrgs = Number(metrics.total_orgs ?? 0);

    const response = NextResponse.json({
      ok: true,
      data: {
        metrics: {
          mrr,
          arr: mrr * 12,
          arpu: activeOrgs > 0 ? mrr / activeOrgs : 0,
          totalOrgs,
          activeOrgs,
          blockedOrgs: Number(metrics.blocked_orgs ?? 0),
          churnRate: Number(metrics.churn_rate ?? 0),
          byPlan: metrics.by_plan ?? {},
        },
        recentEvents: ((data?.recent_events ?? []) as Array<{
          id: string;
          org_id: string;
          org_name: string | null;
          event_type: string;
          plan: string | null;
          amount: number | null;
          status: string;
          created_at: string;
        }>).map((e) => ({
          id: e.id,
          orgId: e.org_id,
          orgName: e.org_name,
          eventType: e.event_type,
          plan: e.plan,
          amount: Number(e.amount ?? 0),
          status: e.status,
          createdAt: e.created_at,
        })),
        blockedOrgs: ((data?.blocked_orgs ?? []) as Array<{
          id: string;
          name: string;
          slug: string;
          billing_status: string;
        }>).map((o) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          billingStatus: o.billing_status,
        })),
      },
    });
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    return response;
  } catch (error) {
    console.error('Get billing error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
