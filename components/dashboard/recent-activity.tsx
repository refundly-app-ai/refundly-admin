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
  'user.login': { icon: LogIn, color: 'text-chart-1', label: 'Login do usuário' },
  'user.logout': { icon: LogIn, color: 'text-muted-foreground', label: 'Logout do usuário' },
  'user.created': { icon: UserPlus, color: 'text-success', label: 'Usuário criado' },
  'user.updated': { icon: Settings, color: 'text-chart-1', label: 'Usuário atualizado' },
  'user.deleted': { icon: UserX, color: 'text-destructive', label: 'Usuário excluído' },
  'user.suspended': { icon: UserX, color: 'text-warning', label: 'Usuário suspenso' },
  'org.created': { icon: Building2, color: 'text-success', label: 'Organização criada' },
  'org.updated': { icon: Building2, color: 'text-chart-1', label: 'Organização atualizada' },
  'org.deleted': { icon: Building2, color: 'text-destructive', label: 'Organização excluída' },
  'org.suspended': { icon: Building2, color: 'text-warning', label: 'Organização suspensa' },
  'billing.subscription_created': { icon: CreditCard, color: 'text-success', label: 'Assinatura criada' },
  'billing.subscription_updated': { icon: CreditCard, color: 'text-chart-1', label: 'Assinatura atualizada' },
  'billing.invoice_paid': { icon: CreditCard, color: 'text-success', label: 'Fatura paga' },
  'settings.updated': { icon: Settings, color: 'text-chart-1', label: 'Configurações atualizadas' },
  'feature_flag.toggled': { icon: Flag, color: 'text-chart-4', label: 'Feature flag alterada' },
  'impersonation.started': { icon: Shield, color: 'text-warning', label: 'Personificação iniciada' },
  'impersonation.ended': { icon: Shield, color: 'text-muted-foreground', label: 'Personificação encerrada' },
};

interface RecentActivityProps {
  logs: AuditLog[];
}

const fallbackConfig = { icon: Settings, color: 'text-muted-foreground', label: '' };

export function RecentActivity({ logs }: RecentActivityProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
          )}
          {logs.map((log) => {
            const config = (actionConfig as Record<string, typeof fallbackConfig>)[log.action] ?? { ...fallbackConfig, label: log.action };
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
