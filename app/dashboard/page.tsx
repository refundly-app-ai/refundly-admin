'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { SystemHealthCard } from '@/components/dashboard/system-health';
import type { DashboardMetrics, AuditLog, TimeSeriesData, ChartData, SystemHealth } from '@/lib/types';

const MRRChart = dynamic(() => import('@/components/dashboard/charts').then((m) => ({ default: m.MRRChart })), { ssr: false });
const SignupsChart = dynamic(() => import('@/components/dashboard/charts').then((m) => ({ default: m.SignupsChart })), { ssr: false });
const TierDistributionChart = dynamic(() => import('@/components/dashboard/charts').then((m) => ({ default: m.TierDistributionChart })), { ssr: false });
const RequestsChart = dynamic(() => import('@/components/dashboard/charts').then((m) => ({ default: m.RequestsChart })), { ssr: false });

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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="col-span-2 bg-card border-border">
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="col-span-2 bg-card border-border">
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
        </div>
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
