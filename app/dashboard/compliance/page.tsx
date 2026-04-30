'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  TrendingDown,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ComplianceIssue {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  orgId: string;
  orgName: string;
  description: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface ComplianceSummary {
  totalIssues: number;
  critical: number;
  warnings: number;
  info: number;
}

interface ComplianceData {
  violations: ComplianceIssue[];
  duplicates: ComplianceIssue[];
  riskQueue: ComplianceIssue[];
  summary: ComplianceSummary;
}

const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-destructive/20 text-destructive border-destructive/30', label: 'Crítico' },
  warning: { color: 'bg-warning/20 text-warning border-warning/30', label: 'Atenção' },
  info: { color: 'bg-info/20 text-info border-info/30', label: 'Info' },
};

const violationTypeLabels: Record<string, string> = {
  expense_limit_exceeded: 'Limite de despesa excedido',
  receipt_duplicate: 'Recibo duplicado',
  high_churn_risk: 'Alto risco de churn',
  missing_receipt: 'Recibo ausente',
  policy_violation: 'Violação de política',
};

function IssueTable({ issues }: { issues: ComplianceIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <CheckCircle className="h-8 w-8 text-success" />
        <p>Nenhum problema encontrado</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organização</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Severidade</TableHead>
          <TableHead>Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue) => (
          <TableRow key={issue.id}>
            <TableCell className="font-medium">{issue.orgName ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {violationTypeLabels[issue.type] ?? issue.type}
            </TableCell>
            <TableCell className="text-sm max-w-xs truncate">{issue.description}</TableCell>
            <TableCell>
              <Badge className={severityConfig[issue.severity]?.color ?? 'bg-muted text-muted-foreground'}>
                {severityConfig[issue.severity]?.label ?? issue.severity}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {format(new Date(issue.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function CompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function fetchData() {
    setIsLoading(true);
    fetch('/api/compliance')
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

  const summary = data?.summary ?? { totalIssues: 0, critical: 0, warnings: 0, info: 0 };
  const violations = data?.violations ?? [];
  const duplicates = data?.duplicates ?? [];
  const riskQueue = data?.riskQueue ?? [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Conformidade</h1>
          <p className="text-sm text-muted-foreground">
            Violações de despesa, recibos duplicados e riscos de churn
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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Problemas
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalIssues}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.critical}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avisos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{summary.warnings}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risco de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskQueue.length}</div>
            <p className="text-xs text-muted-foreground">orgs com health score baixo</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="violations">
            Violações ({violations.length})
          </TabsTrigger>
          <TabsTrigger value="duplicates">
            Duplicatas ({duplicates.length})
          </TabsTrigger>
          <TabsTrigger value="risk">
            Risco de Churn ({riskQueue.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Violações de Despesa</CardTitle>
              <CardDescription>Despesas que violaram políticas da organização</CardDescription>
            </CardHeader>
            <CardContent>
              <IssueTable issues={violations} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Recibos Duplicados
              </CardTitle>
              <CardDescription>Recibos enviados mais de uma vez (fingerprint match)</CardDescription>
            </CardHeader>
            <CardContent>
              <IssueTable issues={duplicates} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Fila de Risco de Churn</CardTitle>
              <CardDescription>Organizações com health score abaixo de 40</CardDescription>
            </CardHeader>
            <CardContent>
              <IssueTable issues={riskQueue} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
