'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Beaker,
  Activity,
  Shield,
} from 'lucide-react';
import type { DashboardMetrics } from '@/lib/types';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-muted-foreground',
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change !== undefined && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3 text-destructive" />
            ) : null}
            <span
              className={cn(
                isPositive && 'text-success',
                isNegative && 'text-destructive',
                !isPositive && !isNegative && 'text-muted-foreground'
              )}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Organizations"
        value={formatNumber(metrics.totalOrganizations)}
        change={metrics.growthRate}
        changeLabel="vs last month"
        icon={Building2}
        iconColor="text-chart-1"
      />
      <MetricCard
        title="Total Members"
        value={formatNumber(metrics.totalMembers)}
        change={8.2}
        changeLabel="vs last month"
        icon={Users}
        iconColor="text-chart-2"
      />
      <MetricCard
        title="Monthly Recurring Revenue"
        value={formatCurrency(metrics.totalMRR)}
        change={metrics.growthRate}
        changeLabel="vs last month"
        icon={DollarSign}
        iconColor="text-chart-3"
      />
      <MetricCard
        title="Active Trials"
        value={metrics.activeTrials}
        change={15.3}
        changeLabel="vs last month"
        icon={Beaker}
        iconColor="text-chart-4"
      />
      <MetricCard
        title="Churn Rate"
        value={`${metrics.churnRate}%`}
        change={-0.5}
        changeLabel="vs last month"
        icon={Activity}
        iconColor="text-destructive"
      />
      <MetricCard
        title="Avg Health Score"
        value={metrics.avgHealthScore}
        change={2.1}
        changeLabel="vs last month"
        icon={Activity}
        iconColor="text-success"
      />
      <MetricCard
        title="Avg Compliance Score"
        value={metrics.avgComplianceScore}
        change={1.8}
        changeLabel="vs last month"
        icon={Shield}
        iconColor="text-chart-1"
      />
      <MetricCard
        title="Growth Rate"
        value={`${metrics.growthRate}%`}
        change={3.2}
        changeLabel="vs last month"
        icon={TrendingUp}
        iconColor="text-success"
      />
    </div>
  );
}
