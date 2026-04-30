'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  Activity,
  RefreshCw,
  Loader2,
  Webhook,
  XCircle,
  Users,
  TrendingDown,
} from 'lucide-react';

interface WebhookHealth {
  successRate: number;
  totalDeliveries24h: number;
  failedDeliveries24h: number;
  retryDepthHistogram: Array<{ depth: number; count: number }>;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface OperationsData {
  scheduledJobs: unknown[];
  webhookHealth: WebhookHealth;
  lifecycleFunnel: FunnelStage[];
}

export default function OperationsPage() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function fetchData() {
    setIsLoading(true);
    fetch('/api/operations')
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

  const webhookHealth = data?.webhookHealth ?? {
    successRate: 100,
    totalDeliveries24h: 0,
    failedDeliveries24h: 0,
    retryDepthHistogram: [],
  };
  const funnel = data?.lifecycleFunnel ?? [];

  const webhookStatusColor =
    webhookHealth.successRate >= 99
      ? 'text-success'
      : webhookHealth.successRate >= 90
      ? 'text-warning'
      : 'text-destructive';

  const webhookProgressColor =
    webhookHealth.successRate >= 99
      ? '[&>div]:bg-success'
      : webhookHealth.successRate >= 90
      ? '[&>div]:bg-warning'
      : '[&>div]:bg-destructive';

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Operações</h1>
          <p className="text-sm text-muted-foreground">
            Saúde de webhooks e funil de ciclo de vida das organizações
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Saúde dos Webhooks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Saúde dos Webhooks (últimas 24h)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
              {webhookHealth.successRate >= 99 ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${webhookStatusColor}`}>
                {webhookHealth.successRate.toFixed(1)}%
              </div>
              <Progress
                value={webhookHealth.successRate}
                className={`mt-2 h-1.5 ${webhookProgressColor}`}
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Entregas Totais
              </CardTitle>
              <Webhook className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {webhookHealth.totalDeliveries24h.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">nas últimas 24 horas</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Falhas
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${webhookHealth.failedDeliveries24h > 0 ? 'text-destructive' : ''}`}>
                {webhookHealth.failedDeliveries24h.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">entregas falharam</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Funil de Ciclo de Vida */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Funil de Ciclo de Vida</h2>
        {funnel.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Activity className="h-8 w-8" />
              <p>Sem dados de ciclo de vida disponíveis</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              {funnel.map((stage, index) => {
                const isChurn = stage.stage.toLowerCase().includes('churn');
                const barColor = isChurn
                  ? '[&>div]:bg-destructive'
                  : index === 0
                  ? '[&>div]:bg-primary'
                  : '[&>div]:bg-chart-1';

                return (
                  <div key={stage.stage} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {isChurn ? (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${isChurn ? 'text-destructive' : ''}`}>
                          {stage.count.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-muted-foreground w-12 text-right">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={stage.percentage}
                      className={`h-2 ${barColor}`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Placeholder para expansão futura */}
      <Card className="bg-card border-border border-dashed">
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground gap-2">
          <Activity className="h-5 w-5" />
          <span className="text-sm">Feature flags e filas de background em breve</span>
        </CardContent>
      </Card>
    </div>
  );
}
