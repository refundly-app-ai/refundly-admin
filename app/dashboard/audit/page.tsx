'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auditLogs } from '@/lib/mock-data';
import type { AuditLog, AuditAction } from '@/lib/types';
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  UserPlus,
  Building2,
  CreditCard,
  Shield,
  Flag,
  LogIn,
  UserX,
  Settings,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';

const actionConfig: Record<AuditAction, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  'user.login': { icon: LogIn, color: 'text-chart-1', label: 'User Login' },
  'user.logout': { icon: LogIn, color: 'text-muted-foreground', label: 'User Logout' },
  'user.created': { icon: UserPlus, color: 'text-success', label: 'User Created' },
  'user.updated': { icon: Settings, color: 'text-chart-1', label: 'User Updated' },
  'user.deleted': { icon: UserX, color: 'text-destructive', label: 'User Deleted' },
  'user.suspended': { icon: UserX, color: 'text-warning', label: 'User Suspended' },
  'org.created': { icon: Building2, color: 'text-success', label: 'Org Created' },
  'org.updated': { icon: Building2, color: 'text-chart-1', label: 'Org Updated' },
  'org.deleted': { icon: Building2, color: 'text-destructive', label: 'Org Deleted' },
  'org.suspended': { icon: Building2, color: 'text-warning', label: 'Org Suspended' },
  'billing.subscription_created': { icon: CreditCard, color: 'text-success', label: 'Subscription Created' },
  'billing.subscription_updated': { icon: CreditCard, color: 'text-chart-1', label: 'Subscription Updated' },
  'billing.invoice_paid': { icon: CreditCard, color: 'text-success', label: 'Invoice Paid' },
  'settings.updated': { icon: Settings, color: 'text-chart-1', label: 'Settings Updated' },
  'feature_flag.toggled': { icon: Flag, color: 'text-chart-4', label: 'Feature Flag Toggled' },
  'impersonation.started': { icon: Shield, color: 'text-warning', label: 'Impersonation Started' },
  'impersonation.ended': { icon: Shield, color: 'text-muted-foreground', label: 'Impersonation Ended' },
};

const actorTypeColors: Record<string, string> = {
  admin: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  user: 'bg-muted text-muted-foreground',
  system: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
};

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');

  // Filter logs
  let filteredLogs = [...auditLogs];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredLogs = filteredLogs.filter(
      (log) =>
        log.actorName.toLowerCase().includes(query) ||
        log.targetName?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
    );
  }

  if (actionFilter !== 'all') {
    filteredLogs = filteredLogs.filter((log) => log.action.startsWith(actionFilter));
  }

  if (actorFilter !== 'all') {
    filteredLogs = filteredLogs.filter((log) => log.actorType === actorFilter);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Track all actions and changes across the platform
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Logs
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admin Actions
            </CardTitle>
            <Shield className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter((l) => l.actorType === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User Actions
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter((l) => l.actorType === 'user').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Actions
            </CardTitle>
            <Settings className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter((l) => l.actorType === 'system').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user">User Actions</SelectItem>
                <SelectItem value="org">Org Actions</SelectItem>
                <SelectItem value="billing">Billing Actions</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="feature_flag">Feature Flags</SelectItem>
                <SelectItem value="impersonation">Impersonation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Actor Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actors</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No logs found.</p>
            ) : (
              filteredLogs.map((log) => {
                const config = actionConfig[log.action];
                const Icon = config.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4"
                  >
                    <div className={`mt-0.5 rounded-full bg-muted p-2 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{log.actorName}</span>
                        <Badge className={actorTypeColors[log.actorType]}>{log.actorType}</Badge>
                        <span className="text-muted-foreground">{config.label}</span>
                        {log.targetName && (
                          <>
                            <span className="text-muted-foreground">on</span>
                            <span className="font-medium text-foreground">{log.targetName}</span>
                          </>
                        )}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 rounded bg-muted/50 p-2">
                          <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</span>
                        <span>({formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })})</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
