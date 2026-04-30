'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { MRRChart, SignupsChart, TierDistributionChart, RequestsChart } from '@/components/dashboard/charts';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { SystemHealthCard } from '@/components/dashboard/system-health';
import type { DashboardMetrics, AuditLog, TimeSeriesData, ChartData, SystemHealth } from '@/lib/types';

interface DashboardData {
  metrics: DashboardMetrics;
  recentLogs: AuditLog[];
  mrrSeries: TimeSeriesData[];
  signupsSeries: TimeSeriesData[];
  tierDistribution: ChartData[];
  requestsSeries: TimeSeriesData[];
  systemHealth: SystemHealth[];
}

const emptyData: DashboardData = {
  metrics: {
    totalOrganizations: 0,
    totalMembers: 0,
    totalMRR: 0,
    activeTrials: 0,
    churnRate: 0,
    growthRate: 0,
    avgHealthScore: 0,
    avgComplianceScore: 0,
  },
  recentLogs: [],
  mrrSeries: [],
  signupsSeries: [],
  tierDistribution: [],
  requestsSeries: [],
  systemHealth: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [kpisRes, chartsRes, healthRes] = await Promise.all([
          fetch('/api/kpis'),
          fetch('/api/dashboard/charts'),
          fetch('/api/system-health'),
        ]);
        const [kpis, charts, health] = await Promise.all([
          kpisRes.json(),
          chartsRes.json(),
          healthRes.json(),
        ]);

        setData({
          metrics: kpis.ok ? kpis.data.metrics : emptyData.metrics,
          recentLogs: kpis.ok ? kpis.data.recentLogs : [],
          mrrSeries: charts.ok ? charts.data.mrrSeries : [],
          signupsSeries: charts.ok ? charts.data.signupsSeries : [],
          tierDistribution: charts.ok ? charts.data.tierDistribution : [],
          requestsSeries: charts.ok ? charts.data.requestsSeries : [],
          systemHealth: health.ok ? health.data : [],
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">
          Métricas e insights de toda a plataforma
        </p>
      </div>

      <MetricsCards metrics={data.metrics} />

      <div className="grid gap-4 lg:grid-cols-3">
        <MRRChart data={data.mrrSeries} />
        <SignupsChart data={data.signupsSeries} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RequestsChart data={data.requestsSeries} />
        <TierDistributionChart data={data.tierDistribution} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity logs={data.recentLogs} />
        <SystemHealthCard services={data.systemHealth} />
      </div>
    </div>
  );
}
