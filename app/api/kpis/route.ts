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

    const kpi = Array.isArray(kpiResult.data) ? kpiResult.data[0] : kpiResult.data;

    const metrics: DashboardMetrics = {
      totalOrganizations: kpi?.total_organizations ?? kpi?.totalOrganizations ?? 0,
      totalMembers: kpi?.total_members ?? kpi?.totalMembers ?? 0,
      totalMRR: kpi?.total_mrr ?? kpi?.totalMRR ?? 0,
      activeTrials: kpi?.active_trials ?? kpi?.activeTrials ?? 0,
      churnRate: kpi?.churn_rate ?? kpi?.churnRate ?? 0,
      growthRate: kpi?.growth_rate ?? kpi?.growthRate ?? 0,
      avgHealthScore: kpi?.avg_health_score ?? kpi?.avgHealthScore ?? 0,
      avgComplianceScore: kpi?.avg_compliance_score ?? kpi?.avgComplianceScore ?? 0,
    };

    const recentLogs: AuditLog[] = (logsResult.data ?? []).map((l: any) => ({
      id: l.id,
      action: l.action,
      actorId: l.admin_id ?? '',
      actorName: l.platform_admins?.full_name || l.platform_admins?.email || 'Sistema',
      actorType: l.admin_id ? ('admin' as const) : ('system' as const),
      targetName: l.organizations?.name,
      metadata: l.metadata ?? {},
      ipAddress: l.ip,
      timestamp: l.created_at,
    }));

    return NextResponse.json({ ok: true, data: { metrics, recentLogs } });
  } catch (error) {
    console.error('Get KPIs error:', error);
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
