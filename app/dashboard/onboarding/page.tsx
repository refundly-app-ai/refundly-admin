'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Receipt,
  Plug,
  GitBranch,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import type { ChurnLevel, OnboardingOrg } from '@/app/api/onboarding/route';

const churnConfig: Record<
  ChurnLevel,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  green: {
    label: 'Saudável',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  yellow: {
    label: 'Atenção',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-500',
  },
  orange: {
    label: 'Risco',
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
  },
  red: {
    label: 'Crítico',
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
  },
};

const planLabels: Record<string, string> = {
  free: 'Gratuito',
  essential: 'Essencial',
  enterprise: 'Enterprise',
  trial: 'Trial',
};

const onboardingSteps: {
  key: keyof OnboardingOrg;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'hasAdminLogin', label: 'Login do admin', icon: ShieldCheck },
  { key: 'hasFirstMember', label: 'Primeiro membro', icon: Users },
  { key: 'hasFirstExpense', label: 'Primeira despesa', icon: Receipt },
  { key: 'hasIntegration', label: 'Integração', icon: Plug },
  { key: 'hasApprovalFlow', label: 'Fluxo de aprovação', icon: GitBranch },
];

function ChurnBadge({ level }: { level: ChurnLevel }) {
  const cfg = churnConfig[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CompletionBar({ pct, level }: { pct: number; level: ChurnLevel }) {
  const cfg = churnConfig[level];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all ${cfg.dot}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

const onboardingStatusConfig: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pendente',    className: 'bg-muted text-muted-foreground' },
  in_progress:{ label: 'Em andamento',className: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' },
  completed:  { label: 'Concluído',   className: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' },
};

function OnboardingStatusBadge({ status }: { status: string | null }) {
  const cfg = status ? onboardingStatusConfig[status] : null;
  if (!cfg) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function StepIcon({
  done,
  label,
  Icon,
}: {
  done: boolean;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted cursor-default">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {done ? (
            <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-emerald-500" />
          ) : (
            <XCircle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-muted-foreground/50" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className={done ? 'text-emerald-500' : 'text-muted-foreground'}>
          {done ? '✓' : '✗'} {label}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

export default function OnboardingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding'],
    queryFn: () => fetch('/api/onboarding').then((r) => r.json()),
  });
  const [search, setSearch] = useState('');
  const [filterChurn, setFilterChurn] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  const summary = data?.data?.summary ?? { total: 0, green: 0, yellow: 0, orange: 0, red: 0, avgCompletion: 0 };

  const filtered = useMemo(() => {
    const orgs: OnboardingOrg[] = data?.data?.orgs ?? [];
    return orgs.filter((o) => {
      const matchSearch =
        !search ||
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.slug.toLowerCase().includes(search.toLowerCase());
      const matchChurn = filterChurn === 'all' || o.churnLevel === filterChurn;
      const matchPlan = filterPlan === 'all' || o.plan === filterPlan;
      return matchSearch && matchChurn && matchPlan;
    });
  }, [data, search, filterChurn, filterPlan]);

  const sorted = useMemo(() => {
    const churnOrder: ChurnLevel[] = ['red', 'orange', 'yellow', 'green'];
    return [...filtered].sort((a, b) => churnOrder.indexOf(a.churnLevel) - churnOrder.indexOf(b.churnLevel));
  }, [filtered]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Acompanhamento de Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Monitore o progresso de cada organização e identifique riscos de churn
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : summary.total}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Média {isLoading ? '—' : `${summary.avgCompletion}%`} concluído
              </p>
            </CardContent>
          </Card>

          {(['green', 'yellow', 'orange', 'red'] as ChurnLevel[]).map((level) => {
            const cfg = churnConfig[level];
            const count = summary[level] as number;
            const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
            const Icon = level === 'green' ? TrendingUp : level === 'red' ? TrendingDown : Minus;
            return (
              <Card key={level} className={`border ${cfg.border} bg-card`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-xs font-medium ${cfg.text}`}>
                    {cfg.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold">
                      {isLoading ? '—' : count}
                    </p>
                    <Icon className={`h-5 w-5 ${cfg.text}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{isLoading ? '—' : `${pct}% do total`}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar organização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterChurn} onValueChange={setFilterChurn}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Nível de churn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="green">Saudável</SelectItem>
              <SelectItem value="yellow">Atenção</SelectItem>
              <SelectItem value="orange">Risco</SelectItem>
              <SelectItem value="red">Crítico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="free">Gratuito</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="essential">Essencial</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sorted.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma organização encontrada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Organização</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Churn</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Progresso</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Passos</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Plano</th>
                      <th className="pb-3 pr-4 font-medium text-muted-foreground">Criação</th>
                      <th className="pb-3 font-medium text-muted-foreground">Último acesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sorted.map((org) => (
                      <tr key={org.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {org.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-40">
                                {org.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-40">
                                {org.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 pr-4">
                          <Tooltip>
                            <TooltipTrigger>
                              <ChurnBadge level={org.churnLevel} />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              {org.churnReason}
                            </TooltipContent>
                          </Tooltip>
                        </td>

                        <td className="py-3 pr-4 min-w-35">
                          <CompletionBar pct={org.completionPct} level={org.churnLevel} />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {org.completedSteps}/{org.totalSteps} passos
                          </p>
                        </td>

                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            {onboardingSteps.map(({ key, label, icon: Icon }) => (
                              <StepIcon
                                key={key}
                                done={org[key] as boolean}
                                label={label}
                                Icon={Icon}
                              />
                            ))}
                          </div>
                        </td>

                        <td className="py-3 pr-4">
                          <OnboardingStatusBadge status={org.onboardingStatus} />
                        </td>

                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="text-xs">
                            {planLabels[org.plan] ?? org.plan}
                          </Badge>
                        </td>

                        <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(org.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </td>

                        <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {org.daysSinceLastAdminLogin !== null ? (
                            <span
                              className={
                                org.daysSinceLastAdminLogin >= 30
                                  ? 'text-red-500'
                                  : org.daysSinceLastAdminLogin >= 14
                                  ? 'text-orange-500'
                                  : org.daysSinceLastAdminLogin >= 7
                                  ? 'text-yellow-500'
                                  : 'text-emerald-500'
                              }
                            >
                              há {org.daysSinceLastAdminLogin}d
                            </span>
                          ) : (
                            <span className="text-red-500">Nunca</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
