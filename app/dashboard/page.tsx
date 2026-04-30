import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { MRRChart, SignupsChart, TierDistributionChart, RequestsChart } from '@/components/dashboard/charts';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { SystemHealthCard } from '@/components/dashboard/system-health';
import {
  mrrTimeSeries,
  signupsTimeSeries,
  tierDistribution,
  requestsTimeSeries,
  systemHealth,
} from '@/lib/mock-data';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { DashboardMetrics, AuditLog } from '@/lib/types';

export default async function DashboardPage() {
  const [kpiResult, logsResult] = await Promise.all([
    supabaseAdmin.rpc('superadmin_global_kpis'),
    supabaseAdmin
      .from('audit_logs')
      .select('*, organizations(name), profiles(full_name, email)')
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
    actorId: l.actor_id ?? '',
    actorName: l.profiles?.full_name || l.profiles?.email || 'Desconhecido',
    actorType: 'user' as const,
    targetName: l.organizations?.name,
    metadata: l.metadata ?? {},
    ipAddress: l.ip,
    timestamp: l.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">
          Métricas e insights de toda a plataforma
        </p>
      </div>

      <MetricsCards metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MRRChart data={mrrTimeSeries} />
        <SignupsChart data={signupsTimeSeries} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RequestsChart data={requestsTimeSeries} />
        <TierDistributionChart data={tierDistribution} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity logs={recentLogs} />
        <SystemHealthCard services={systemHealth} />
      </div>
    </div>
  );
}
