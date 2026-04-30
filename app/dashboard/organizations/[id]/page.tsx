'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Building2,
  Users,
  Activity,
  CreditCard,
  Plug,
  FileText,
  AlertTriangle,
  Loader2,
  MoreHorizontal,
  Ban,
  Play,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Organization, Member, Activity as ActivityType, BillingEvent, Integration } from '@/lib/types';

interface OrgDetailData {
  organization: Organization;
  members: Member[];
  activities: ActivityType[];
  billingEvents: BillingEvent[];
  integrations: Integration[];
}

const statusConfig = {
  active: { label: 'Ativo', variant: 'default' as const, className: 'bg-success/10 text-success border-success/20' },
  suspended: { label: 'Suspenso', variant: 'secondary' as const, className: 'bg-warning/10 text-warning border-warning/20' },
  blocked: { label: 'Bloqueado', variant: 'destructive' as const, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  churned: { label: 'Churned', variant: 'outline' as const, className: 'bg-muted text-muted-foreground' },
  trial: { label: 'Trial', variant: 'secondary' as const, className: 'bg-info/10 text-info border-info/20' },
};

const planConfig = {
  free: { label: 'Free', className: 'bg-muted text-muted-foreground' },
  basic: { label: 'Basic', className: 'bg-info/10 text-info border-info/20' },
  pro: { label: 'Pro', className: 'bg-primary/10 text-primary border-primary/20' },
  enterprise: { label: 'Enterprise', className: 'bg-success/10 text-success border-success/20' },
};

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<OrgDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [changePlanDialog, setChangePlanDialog] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [newPlan, setNewPlan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/organizations/${params.id}`);
        const result = await res.json();

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setData(result.data);
      } catch {
        setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

  async function handleSuspend() {
    if (!data) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${params.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmSlug, reason: suspendReason }),
      });

      const result = await res.json();
      if (result.ok) {
        setData({ ...data, organization: { ...data.organization, status: 'suspended' } });
        setSuspendDialog(false);
        setConfirmSlug('');
        setSuspendReason('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReactivate() {
    if (!data) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${params.id}/reactivate`, {
        method: 'POST',
      });

      const result = await res.json();
      if (result.ok) {
        setData({ ...data, organization: { ...data.organization, status: 'active' } });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangePlan() {
    if (!data || !newPlan) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/organizations/${params.id}/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmSlug, newPlan }),
      });

      const result = await res.json();
      if (result.ok) {
        setData({ ...data, organization: { ...data.organization, plan: newPlan as Organization['plan'] } });
        setChangePlanDialog(false);
        setConfirmSlug('');
        setNewPlan('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error || 'Organização não encontrada'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const { organization: org, members, activities, billingEvents, integrations } = data;
  const usagePercent = org.monthlyLimit
    ? Math.round(((org.monthlyUsage ?? 0) / org.monthlyLimit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{org.name}</h1>
              <Badge className={statusConfig[org.status].className}>
                {statusConfig[org.status].label}
              </Badge>
              <Badge variant="outline" className={planConfig[org.plan].className}>
                {planConfig[org.plan].label}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">{org.slug}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {org.status === 'active' ? (
              <DropdownMenuItem onClick={() => setSuspendDialog(true)}>
                <Ban className="h-4 w-4 mr-2" />
                Suspender
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleReactivate} disabled={isSubmitting}>
                <Play className="h-4 w-4 mr-2" />
                Reativar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setChangePlanDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Alterar Plano
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Deletar Organização
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Building2 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Membros ({members.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Cobrança
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{org.healthScore}</span>
                  <span className="text-muted-foreground mb-1">/100</span>
                </div>
                <Progress value={org.healthScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Uso Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{(org.monthlyUsage ?? 0).toLocaleString('pt-BR')}</span>
                  <span className="text-muted-foreground mb-1">/ {(org.monthlyLimit ?? 0).toLocaleString('pt-BR')}</span>
                </div>
                <Progress value={usagePercent} className={`mt-2 ${usagePercent > 80 ? '[&>div]:bg-warning' : ''}`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">
                  {org.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em</span>
                  <span className="font-medium">{format(new Date(org.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeira atividade</span>
                  <span className="font-medium">
                    {org.firstActivityAt ? format(new Date(org.firstActivityAt), "dd/MM/yyyy", { locale: ptBR }) : 'Nenhuma'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último login admin</span>
                  <span className="font-medium">
                    {org.lastAdminLoginAt ? format(new Date(org.lastAdminLoginAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de membros</span>
                  <span className="font-medium">{org.membersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membros ativos (30d)</span>
                  <span className="font-medium">{org.activeMembers30d}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Membros Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {(member.fullName ?? member.name ?? '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.fullName ?? member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.orgs?.find(o => o.orgId === org.id)?.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Membros</CardTitle>
              <CardDescription>Todos os membros desta organização</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {(member.fullName ?? member.name ?? '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.fullName ?? member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.orgs?.find(o => o.orgId === org.id)?.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.lastSignInAt
                          ? format(new Date(member.lastSignInAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        {member.banned ? (
                          <Badge variant="destructive">Banido</Badge>
                        ) : member.verifiedChannel ? (
                          <Badge className="bg-success/10 text-success">Verificado</Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas ações nesta organização</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 20).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.entity} {activity.entityId && `(${activity.entityId})`}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(activity.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Plano Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${planConfig[org.plan].className} text-lg px-3 py-1`}>
                  {planConfig[org.plan].label}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Uso / Limite</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usagePercent}%
                </div>
                <Progress value={usagePercent} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {org.mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Cobrança</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{event.type}</TableCell>
                      <TableCell>
                        {event.amount
                          ? event.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            event.status === 'success'
                              ? 'bg-success/10 text-success'
                              : event.status === 'failed'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                          }
                        >
                          {event.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{integration.kind}</Badge>
                    <Badge
                      className={
                        integration.status === 'connected'
                          ? 'bg-success/10 text-success'
                          : integration.status === 'degraded'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }
                    >
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Última conexão:{' '}
                    {integration.lastSeenAt
                      ? format(new Date(integration.lastSeenAt), "dd/MM HH:mm", { locale: ptBR })
                      : 'Nunca'}
                  </p>
                  {integration.lastError && (
                    <p className="text-sm text-destructive mt-2 truncate">{integration.lastError}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Log de Auditoria</CardTitle>
              <CardDescription>Ações de administradores nesta organização</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities
                  .filter(a => a.entity === 'organization' || a.action.includes('org'))
                  .slice(0, 20)
                  .map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        {activity.metadata && (
                          <pre className="text-xs text-muted-foreground mt-1 font-mono bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(activity.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                        {activity.ip && (
                          <p className="text-xs text-muted-foreground font-mono">{activity.ip}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender Organização</DialogTitle>
            <DialogDescription>
              Esta ação irá suspender o acesso de todos os membros. Digite o slug da organização para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da suspensão</Label>
              <Textarea
                placeholder="Descreva o motivo..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Digite <code className="font-mono bg-muted px-1 py-0.5 rounded">{org.slug}</code> para confirmar
              </Label>
              <Input
                placeholder={org.slug}
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={confirmSlug !== org.slug || !suspendReason || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanDialog} onOpenChange={setChangePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>
              Selecione o novo plano e confirme digitando o slug da organização.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo Plano</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Digite <code className="font-mono bg-muted px-1 py-0.5 rounded">{org.slug}</code> para confirmar
              </Label>
              <Input
                placeholder={org.slug}
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePlanDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={confirmSlug !== org.slug || !newPlan || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Alterar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
