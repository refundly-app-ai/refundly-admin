'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Phone,
  Clock,
  Building2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppInstance {
  id: string;
  orgId: string;
  orgName: string;
  orgSlug: string;
  status: 'connected' | 'disconnected' | 'degraded' | string;
  lastSeenAt: string | null;
  instanceName: string;
  phoneNumber: string | null;
  connectionState: string | null;
}

interface IntegrationSummary {
  total: number;
  connected: number;
  degraded: number;
  disconnected: number;
}

interface IntegrationsData {
  integrations: WhatsAppInstance[];
  summary: IntegrationSummary;
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  connected: { color: 'bg-success/20 text-success border-success/30', label: 'Conectado', icon: Wifi },
  disconnected: { color: 'bg-muted text-muted-foreground', label: 'Desconectado', icon: WifiOff },
  degraded: { color: 'bg-warning/20 text-warning border-warning/30', label: 'Degradado', icon: AlertTriangle },
};

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { color: 'bg-muted text-muted-foreground', label: status, icon: WifiOff };
}

export default function IntegrationsPage() {
  const [data, setData] = useState<IntegrationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function fetchData() {
    setIsLoading(true);
    fetch('/api/integrations')
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) setData(result.data);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summary = data?.summary ?? { total: 0, connected: 0, degraded: 0, disconnected: 0 };
  const integrations = data?.integrations ?? [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Integrações WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Instâncias de WhatsApp conectadas por organização
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">instâncias cadastradas</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conectadas</CardTitle>
            <Wifi className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summary.connected}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Degradadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{summary.degraded}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desconectadas</CardTitle>
            <WifiOff className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.disconnected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de instâncias */}
      {integrations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <MessageCircle className="h-12 w-12" />
            <p className="text-lg font-medium">Nenhuma instância encontrada</p>
            <p className="text-sm">Nenhuma organização possui WhatsApp conectado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((instance) => {
            const config = getStatusConfig(instance.status);
            const StatusIcon = config.icon;

            return (
              <Card key={instance.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                        <MessageCircle className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{instance.instanceName}</CardTitle>
                        <CardDescription className="text-xs">{instance.orgName}</CardDescription>
                      </div>
                    </div>
                    <Badge className={config.color}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {instance.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono">{instance.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono text-xs">{instance.orgSlug}</span>
                  </div>
                  {instance.lastSeenAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {formatDistanceToNow(new Date(instance.lastSeenAt), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {instance.connectionState && instance.connectionState !== instance.status && (
                    <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1">
                      {instance.connectionState}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
