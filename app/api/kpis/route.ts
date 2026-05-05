import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { DashboardMetrics, AuditLog } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.adminId || !session.totpVerified) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }

    const [kpiResult, logsResult] = await Promise.all([
      supabaseAdmin.rpc('superadmin_global_kpis'),
      supabaseAdmin
        .from('platform_audit_logs')
        .select('id, action, admin_id, org_id, metadata, ip, created_at, platform_admins(email, full_name), organizations(name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (kpiResult.error) {
      console.error('RPC superadmin_global_kpis error:', kpiResult.error);
    }

    const kpi = Array.isArray(kpiResult.data) ? kpiResult.data[0] : kpiResult.data;

    const metrics: DashboardMetrics = {
      totalOrganizations: kpi?.total_organizations ?? 0,
      totalMembers: kpi?.total_members ?? 0,
      totalMRR: kpi?.total_mrr ?? 0,
      activeTrials: kpi?.active_trials ?? 0,
      churnRate: kpi?.churn_rate ?? 0,
      growthRate: kpi?.growth_rate ?? 0,
      avgHealthScore: kpi?.avg_health_score ?? 0,
      avgComplianceScore: kpi?.avg_compliance_score ?? 0,
    };

    const recentLogs: AuditLog[] = (logsResult.data ?? []).map((l) => {
      const admin = Array.isArray(l.platform_admins) ? l.platform_admins[0] : l.platform_admins;
      const org = Array.isArray(l.organizations) ? l.organizations[0] : l.organizations;
      return {
        id: l.id,
        action: l.action,
        actorId: l.admin_id ?? '',
        actorName: admin?.full_name || admin?.email || 'Sistema',
        actorType: l.admin_id ? ('admin' as const) : ('system' as const),
        targetName: org?.name,
        metadata: l.metadata ?? {},
        ipAddress: l.ip,
        timestamp: l.created_at,
      };
    });

    const response = NextResponse.json({ ok: true, data: { metrics, recentLogs } });
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    return response;
  } catch (error) {
    console.error('Get KPIs error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
