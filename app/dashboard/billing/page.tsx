'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Users,
  BarChart3,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BillingMetrics {
  mrr: number;
  arr: number;
  arpu: number;
  churnRate: number;
  dunningTotal: number;
}

interface BillingEvent {
  id: string;
  orgId: string;
  orgName: string;
  eventType: string;
  amount: number | null;
  status: string;
  createdAt: string;
}

interface BlockedOrg {
  id: string;
  name: string;
  plan: string;
  mrr: number;
}

interface BillingData {
  metrics: BillingMetrics;
  recentEvents: BillingEvent[];
  blockedOrgs: BlockedOrg[];
}

const eventStatusColors: Record<string, string> = {
  success: 'bg-success/20 text-success border-success/30',
  paid: 'bg-success/20 text-success border-success/30',
  failed: 'bg-destructive/20 text-destructive border-destructive/30',
  pending: 'bg-warning/20 text-warning border-warning/30',
  refunded: 'bg-muted text-muted-foreground',
};

const eventStatusLabels: Record<string, string> = {
  success: 'Aprovado',
  paid: 'Pago',
  failed: 'Falhou',
  pending: 'Pendente',
  refunded: 'Reembolsado',
};

const eventTypeLabels: Record<string, string> = {
  payment_created: 'Cobrança criada',
  payment_received: 'Pagamento recebido',
  payment_overdue: 'Vencida',
  payment_refunded: 'Reembolso',
  subscription_created: 'Assinatura criada',
  subscription_cancelled: 'Assinatura cancelada',
};

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing')
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) setData(result.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const metrics = { churnRate: 0, dunningTotal: 0, mrr: 0, arr: 0, arpu: 0, ...data?.metrics };
  const events = data?.recentEvents ?? [];
  const blockedOrgs = data?.blockedOrgs ?? [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cobrança</h1>
          <p className="text-sm text-muted-foreground">
            Métricas financeiras e eventos de cobrança via Asaas
          </p>
        </div>
        <Button asChild>
          <a href="https://www.asaas.com/login/auth" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Painel Asaas
          </a>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(metrics.mrr)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle>
            <BarChart3 className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(metrics.arr)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ARPU</CardTitle>
            <Users className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(metrics.arpu)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {metrics.churnRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Recuperação</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatBRL(metrics.dunningTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Eventos Recentes */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Eventos Recentes</h2>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum evento encontrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organização</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.orgName ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {eventTypeLabels[event.eventType] ?? event.eventType}
                        </TableCell>
                        <TableCell className="font-mono">
                          {event.amount != null ? formatBRL(event.amount) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={eventStatusColors[event.status] ?? 'bg-muted text-muted-foreground'}>
                            {eventStatusLabels[event.status] ?? event.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(event.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Organizações Bloqueadas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Orgs Bloqueadas</h2>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              {blockedOrgs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma organização bloqueada</p>
              ) : (
                <div className="space-y-3">
                  {blockedOrgs.map((org) => (
                    <div key={org.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium text-sm">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{formatBRL(org.mrr)}</p>
                        <Badge variant="destructive" className="text-xs">
                          <Ban className="h-2.5 w-2.5 mr-1" />
                          Bloqueada
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
