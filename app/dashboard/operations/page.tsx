'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { systemHealth, featureFlags } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Flag,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Server,
  Database,
  Globe,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

export default function OperationsPage() {
  const healthyServices = systemHealth.filter((s) => s.status === 'healthy').length;
  const degradedServices = systemHealth.filter((s) => s.status === 'degraded').length;
  const downServices = systemHealth.filter((s) => s.status === 'down').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'degraded':
        return 'text-warning';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-success';
      case 'degraded':
        return 'bg-warning';
      case 'down':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'degraded':
        return AlertTriangle;
      case 'down':
        return XCircle;
      default:
        return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Operations</h1>
          <p className="text-sm text-muted-foreground">
            System health, feature flags, and operational controls
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
        </TabsList>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-4">
          {/* Health Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Healthy
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{healthyServices}</div>
                <p className="text-xs text-muted-foreground">services operational</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Degraded
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{degradedServices}</div>
                <p className="text-xs text-muted-foreground">services with issues</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Down
                </CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{downServices}</div>
                <p className="text-xs text-muted-foreground">services offline</p>
              </CardContent>
            </Card>
          </div>

          {/* Services List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemHealth.map((service) => {
                  const StatusIcon = getStatusIcon(service.status);
                  return (
                    <div
                      key={service.service}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('rounded-full p-2', getStatusBg(service.status) + '/20')}>
                          <StatusIcon className={cn('h-4 w-4', getStatusColor(service.status))} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{service.service}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Latency: {service.latency}ms</span>
                            <span>Uptime: {service.uptime}%</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={cn(
                        service.status === 'healthy' && 'bg-success/20 text-success border-success/30',
                        service.status === 'degraded' && 'bg-warning/20 text-warning border-warning/30',
                        service.status === 'down' && 'bg-destructive/20 text-destructive border-destructive/30'
                      )}>
                        {service.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags Tab */}
        <TabsContent value="flags" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Feature Flags</CardTitle>
              <Button size="sm">
                <Flag className="mr-2 h-4 w-4" />
                Create Flag
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-foreground">{flag.name}</p>
                        <code className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {flag.key}
                        </code>
                      </div>
                      {flag.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{flag.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Rollout:</span>
                          <Progress value={flag.rolloutPercentage} className="h-1.5 w-24" />
                          <span className="text-xs text-muted-foreground">{flag.rolloutPercentage}%</span>
                        </div>
                        {flag.targetTiers && flag.targetTiers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Tiers:</span>
                            {flag.targetTiers.map((tier) => (
                              <Badge key={tier} variant="secondary" className="text-xs">
                                {tier}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch checked={flag.enabled} />
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Background Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Processing
                </CardTitle>
                <Activity className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
                <Pause className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Failed
                </CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">3</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Job Queues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Email Queue', processing: 5, pending: 23, failed: 1, icon: Globe },
                  { name: 'Webhook Delivery', processing: 3, pending: 12, failed: 0, icon: Activity },
                  { name: 'Data Sync', processing: 2, pending: 8, failed: 2, icon: Database },
                  { name: 'Report Generation', processing: 2, pending: 2, failed: 0, icon: Server },
                ].map((queue) => (
                  <div
                    key={queue.name}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <queue.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{queue.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-chart-1">{queue.processing} processing</span>
                      <span className="text-warning">{queue.pending} pending</span>
                      <span className={queue.failed > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                        {queue.failed} failed
                      </span>
                      <Button variant="ghost" size="sm">
                        <Play className="mr-1 h-4 w-4" />
                        Process
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
