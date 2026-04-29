import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { MRRChart, SignupsChart, TierDistributionChart, RequestsChart } from '@/components/dashboard/charts';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { SystemHealthCard } from '@/components/dashboard/system-health';
import {
  dashboardMetrics,
  mrrTimeSeries,
  signupsTimeSeries,
  tierDistribution,
  requestsTimeSeries,
  auditLogs,
  systemHealth,
} from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide metrics and insights
        </p>
      </div>

      {/* Metrics Cards */}
      <MetricsCards metrics={dashboardMetrics} />

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <MRRChart data={mrrTimeSeries} />
        <SignupsChart data={signupsTimeSeries} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RequestsChart data={requestsTimeSeries} />
        <TierDistributionChart data={tierDistribution} />
      </div>

      {/* Activity and System Health */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity logs={auditLogs} />
        <SystemHealthCard services={systemHealth} />
      </div>
    </div>
  );
}
