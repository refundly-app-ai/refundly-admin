'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  Building2,
  CreditCard,
  Shield,
  Flag,
  LogIn,
  UserX,
  Settings,
} from 'lucide-react';
import type { AuditLog, AuditAction } from '@/lib/types';

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

interface RecentActivityProps {
  logs: AuditLog[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => {
            const config = actionConfig[log.action];
            const Icon = config.icon;

            return (
              <div key={log.id} className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full bg-muted p-2 ${config.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {log.actorName}
                    </span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {log.actorType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.label}
                    {log.targetName && (
                      <span className="font-medium text-foreground"> {log.targetName}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
