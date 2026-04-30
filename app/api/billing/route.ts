import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const [eventsResult, orgsResult] = await Promise.all([
      supabaseAdmin
        .from('asaas_billing_events')
        .select('*, organizations(name, slug)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('organizations')
        .select('id, name, plan, status, mrr, slug'),
    ]);

    const events = eventsResult.data ?? [];
    const orgs = orgsResult.data ?? [];

    const activeOrgs = orgs.filter((o: any) => o.status === 'active');
    const mrr = activeOrgs.reduce((sum: number, o: any) => sum + (o.mrr || 0), 0);
    const arr = mrr * 12;
    const arpu = activeOrgs.length > 0 ? mrr / activeOrgs.length : 0;
    const churnRate = orgs.length > 0
      ? (orgs.filter((o: any) => o.status === 'churned').length / orgs.length) * 100
      : 0;

    const failedEvents = events.filter((e: any) => e.status === 'failed');
    const dunningTotal = failedEvents.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    return NextResponse.json({
      ok: true,
      data: {
        metrics: { mrr, arr, arpu, churnRate, dunningTotal },
        recentEvents: events.slice(0, 20).map((e: any) => ({
          id: e.id,
          orgId: e.org_id,
          orgName: e.organizations?.name,
          eventType: e.event_type ?? e.type,
          amount: e.amount,
          status: e.status,
          createdAt: e.created_at,
        })),
        orgsNearLimit: [],
        blockedOrgs: orgs.filter((o: any) => o.status === 'blocked').map((o: any) => ({
          id: o.id,
          name: o.name,
          plan: o.plan,
          mrr: o.mrr,
        })),
      },
    });
  } catch (error) {
    console.error('Get billing error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
