'use client';

import { useState } from 'react';
import useSWR from 'swr';
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
import {
  FileText,
  Download,
  Search,
  Filter,
  UserPlus,
  Building2,
  CreditCard,
  Shield,
  Flag,
  LogIn,
  UserX,
  Settings,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const fallbackConfig = { icon: Settings, color: 'text-muted-foreground', label: '' };

const actionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
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

const actorTypeColors: Record<string, string> = {
  admin: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  user: 'bg-muted text-muted-foreground',
  system: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
};

const actorTypeLabels: Record<string, string> = {
  admin: 'Admin',
  user: 'Usuário',
  system: 'Sistema',
};

export default function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: auditData, isLoading } = useSWR('/api/audit?type=tenant&limit=100', fetcher);

  const rawLogs = (auditData?.data?.items ?? []).map((l: any) => ({
    id: l.id,
    action: l.action as string,
    actorId: l.actor_id ?? '',
    actorName: l.profiles?.full_name || l.profiles?.email || 'Desconhecido',
    actorType: 'user',
    targetName: l.organizations?.name,
    metadata: l.metadata ?? {},
    ipAddress: l.ip ?? l.ip_address,
    timestamp: l.created_at,
  }));

  let filteredLogs = [...rawLogs];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredLogs = filteredLogs.filter(
      (log) =>
        log.actorName.toLowerCase().includes(q) ||
        log.targetName?.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
    );
  }

  if (actionFilter !== 'all') {
    filteredLogs = filteredLogs.filter((log) => log.action.startsWith(actionFilter));
  }

  const total = auditData?.data?.pagination?.total ?? rawLogs.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Logs de Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe todas as ações e alterações na plataforma
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Logs
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Logs
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : total}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ações de Usuários
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : rawLogs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resultados Filtrados
            </CardTitle>
            <Filter className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : filteredLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="user">Ações de Usuário</SelectItem>
                <SelectItem value="org">Ações de Organização</SelectItem>
                <SelectItem value="billing">Faturamento</SelectItem>
                <SelectItem value="settings">Configurações</SelectItem>
                <SelectItem value="feature_flag">Feature Flags</SelectItem>
                <SelectItem value="impersonation">Personificação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum log encontrado.</p>
              ) : (
                filteredLogs.map((log) => {
                  const config = actionConfig[log.action] ?? { ...fallbackConfig, label: log.action };
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
                          <Badge className={actorTypeColors[log.actorType] ?? actorTypeColors.user}>
                            {actorTypeLabels[log.actorType] ?? log.actorType}
                          </Badge>
                          <span className="text-muted-foreground">{config.label}</span>
                          {log.targetName && (
                            <>
                              <span className="text-muted-foreground">em</span>
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
                          <span>{format(new Date(log.timestamp), "d 'de' MMM, yyyy HH:mm:ss", { locale: ptBR })}</span>
                          <span>({formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ptBR })})</span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
