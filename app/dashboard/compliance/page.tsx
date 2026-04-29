'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { complianceReports } from '@/lib/mock-data';
import type { ComplianceStatus, ComplianceFramework } from '@/lib/types';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<ComplianceStatus, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  compliant: { color: 'bg-success/20 text-success border-success/30', icon: CheckCircle },
  non_compliant: { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertTriangle },
  pending_review: { color: 'bg-warning/20 text-warning border-warning/30', icon: Clock },
};

const frameworkColors: Record<ComplianceFramework, string> = {
  SOC2: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  GDPR: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  HIPAA: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  ISO27001: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  PCI_DSS: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
};

export default function CompliancePage() {
  // Stats
  const stats = {
    total: complianceReports.length,
    compliant: complianceReports.filter((r) => r.status === 'compliant').length,
    nonCompliant: complianceReports.filter((r) => r.status === 'non_compliant').length,
    criticalIssues: complianceReports.reduce((sum, r) => sum + r.criticalIssues, 0),
  };

  const avgScore = Math.round(
    complianceReports.reduce((sum, r) => sum + r.score, 0) / complianceReports.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Monitor compliance status across all frameworks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Audit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Compliance Score
            </CardTitle>
            <Shield className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}%</div>
            <Progress value={avgScore} className="mt-2 h-1" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliant
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.compliant}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.total} reports
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Non-Compliant
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.nonCompliant}</div>
            <p className="text-xs text-muted-foreground">
              requiring attention
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Issues
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              need immediate action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="soc2">SOC 2</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR</TabsTrigger>
          <TabsTrigger value="hipaa">HIPAA</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {complianceReports.map((report) => {
            const StatusIcon = statusConfig[report.status].icon;
            return (
              <Card key={report.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={frameworkColors[report.framework]}>
                        {report.framework}
                      </Badge>
                      <CardTitle className="text-base">{report.organizationName}</CardTitle>
                    </div>
                    <Badge className={statusConfig[report.status].color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription>
                    Last audit: {formatDistanceToNow(new Date(report.lastAuditDate), { addSuffix: true })}
                    {' | '}
                    Next audit: {formatDistanceToNow(new Date(report.nextAuditDate), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Compliance Score</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{report.score}%</span>
                        <Progress value={report.score} className="flex-1 h-2" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Issues</p>
                      <p className="text-2xl font-bold">{report.issues}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Critical Issues</p>
                      <p className={`text-2xl font-bold ${report.criticalIssues > 0 ? 'text-destructive' : ''}`}>
                        {report.criticalIssues}
                      </p>
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-4 w-4" />
                        View Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="soc2">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              {complianceReports.filter((r) => r.framework === 'SOC2').length === 0 ? (
                <p className="text-center text-muted-foreground">No SOC 2 reports found.</p>
              ) : (
                complianceReports
                  .filter((r) => r.framework === 'SOC2')
                  .map((report) => (
                    <div key={report.id} className="py-2">
                      <p className="font-medium">{report.organizationName}</p>
                      <p className="text-sm text-muted-foreground">Score: {report.score}%</p>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gdpr">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              {complianceReports.filter((r) => r.framework === 'GDPR').length === 0 ? (
                <p className="text-center text-muted-foreground">No GDPR reports found.</p>
              ) : (
                complianceReports
                  .filter((r) => r.framework === 'GDPR')
                  .map((report) => (
                    <div key={report.id} className="py-2">
                      <p className="font-medium">{report.organizationName}</p>
                      <p className="text-sm text-muted-foreground">Score: {report.score}%</p>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hipaa">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              {complianceReports.filter((r) => r.framework === 'HIPAA').length === 0 ? (
                <p className="text-center text-muted-foreground">No HIPAA reports found.</p>
              ) : (
                complianceReports
                  .filter((r) => r.framework === 'HIPAA')
                  .map((report) => (
                    <div key={report.id} className="py-2">
                      <p className="font-medium">{report.organizationName}</p>
                      <p className="text-sm text-muted-foreground">Score: {report.score}%</p>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
