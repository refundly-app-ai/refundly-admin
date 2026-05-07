'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [isExporting, setIsExporting] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({ type: 'tenant', limit: '50' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (actionFilter !== 'all') params.set('action', actionFilter);
    return `/api/audit?${params.toString()}`;
  }, [debouncedSearch, actionFilter]);

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit', debouncedSearch, actionFilter],
    queryFn: () => fetch(apiUrl).then((r) => r.json()),
  });

  type AuditLogItem = { id: string; action: string; actorId: string; actorName: string; actorType: string; targetName: string | undefined; metadata: Record<string, unknown>; ipAddress: string; timestamp: string };
  const filteredLogs: AuditLogItem[] = (auditData?.data?.items ?? []).map((l: Record<string, unknown>) => ({
    id: l.id as string,
    action: l.action as string,
    actorId: (l.actorId as string) ?? '',
    actorName: (l.actorName as string) || 'Desconhecido',
    actorType: 'user',
    targetName: (l.orgName as string) ?? undefined,
    metadata: (l.metadata as Record<string, unknown>) ?? {},
    ipAddress: (l.ip as string) ?? '',
    timestamp: l.createdAt as string,
  }));

  const total = auditData?.data?.pagination?.total ?? filteredLogs.length;

  async function handleExport() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ type: 'tenant' });
      if (actionFilter !== 'all') params.set('action', actionFilter);

      const res = await fetch(`/api/audit/export?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao exportar');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user sees no download
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Logs de Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe todas as ações e alterações na plataforma
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
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
              {isLoading ? <Skeleton className="h-8 w-16" /> : total}
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
            <div className="text-2xl font-bold">{isLoading ? '—' : filteredLogs.length}</div>
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
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 rounded-lg border border-border p-4">
                  <Skeleton className="mt-0.5 h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
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
