'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { integrations } from '@/lib/mock-data';
import type { IntegrationStatus } from '@/lib/types';
import {
  Plug,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Settings,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<IntegrationStatus, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  connected: { color: 'bg-success/20 text-success border-success/30', icon: Check, label: 'Connected' },
  disconnected: { color: 'bg-muted text-muted-foreground', icon: X, label: 'Disconnected' },
  error: { color: 'bg-destructive/20 text-destructive border-destructive/30', icon: AlertTriangle, label: 'Error' },
  syncing: { color: 'bg-info/20 text-info border-info/30', icon: Loader2, label: 'Syncing' },
};

const availableIntegrations = [
  { name: 'Stripe', provider: 'stripe', description: 'Payment processing and billing' },
  { name: 'Intercom', provider: 'intercom', description: 'Customer messaging platform' },
  { name: 'HubSpot', provider: 'hubspot', description: 'CRM and marketing automation' },
  { name: 'Zendesk', provider: 'zendesk', description: 'Customer support ticketing' },
];

export default function IntegrationsPage() {
  // Stats
  const stats = {
    total: integrations.length,
    connected: integrations.filter((i) => i.status === 'connected').length,
    errors: integrations.filter((i) => i.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Manage third-party integrations across organizations
          </p>
        </div>
        <Button>
          <Plug className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Integrations
            </CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connected
            </CardTitle>
            <Check className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.connected}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Errors
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => {
            const StatusIcon = statusConfig[integration.status].icon;
            return (
              <Card key={integration.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Plug className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription>{integration.organizationName}</CardDescription>
                      </div>
                    </div>
                    <Badge className={statusConfig[integration.status].color}>
                      <StatusIcon className={`mr-1 h-3 w-3 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                      {statusConfig[integration.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integration.errorMessage && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2">
                        <p className="text-sm text-destructive">{integration.errorMessage}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connected</span>
                      <span>{formatDistanceToNow(new Date(integration.connectedAt), { addSuffix: true })}</span>
                    </div>
                    {integration.lastSyncAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last synced</span>
                        <span>{formatDistanceToNow(new Date(integration.lastSyncAt), { addSuffix: true })}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Sync
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="mr-1 h-4 w-4" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Available Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {availableIntegrations.map((integration) => (
            <Card key={integration.provider} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Plug className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
