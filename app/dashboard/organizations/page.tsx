'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/dashboard/data-table';
import type { Organization, OrganizationStatus, Plan } from '@/lib/types';
import {
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Building2,
  Users,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OrgTier = Plan;

const statusColors: Record<OrganizationStatus, string> = {
  active: 'bg-success/20 text-success border-success/30',
  suspended: 'bg-warning/20 text-warning border-warning/30',
  blocked: 'bg-destructive/20 text-destructive border-destructive/30',
  churned: 'bg-destructive/20 text-destructive border-destructive/30',
  trial: 'bg-info/20 text-info border-info/30',
};

const statusLabels: Record<OrganizationStatus, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  blocked: 'Bloqueado',
  churned: 'Cancelado',
  trial: 'Trial',
};

const tierColors: Record<OrgTier, string> = {
  free: 'bg-muted text-muted-foreground',
  basic: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  pro: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
};

const tierLabels: Record<OrgTier, string> = {
  free: 'Gratuito',
  basic: 'Básico',
  pro: 'Pro',
};

export default function OrganizationsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: orgsData, isLoading } = useSWR('/api/organizations?limit=100', fetcher);

  const organizations: Organization[] = (orgsData?.data?.items ?? []).map((o: any) => ({
    ...o,
    tier: (o.plan ?? o.tier) as OrgTier,
    memberCount: o.member_count ?? o.memberCount ?? 0,
    healthScore: o.health_score ?? o.healthScore ?? 0,
    lastActiveAt: o.last_active_at ?? o.lastActiveAt ?? o.created_at,
    mrr: o.mrr ?? 0,
    featureFlags: o.feature_flags ?? o.featureFlags ?? [],
    complianceScore: o.compliance_score ?? o.complianceScore ?? 0,
  }));

  const stats = {
    total: orgsData?.data?.pagination?.total ?? organizations.length,
    active: organizations.filter((o) => o.status === 'active').length,
    totalMRR: organizations.reduce((s, o) => s + (o.mrr ?? 0), 0),
    totalMembers: organizations.reduce((s, o) => s + (o.memberCount ?? 0), 0),
  };

  const columns = [
    {
      key: 'name',
      header: 'Organização',
      cell: (org: Organization) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {org.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{org.name}</p>
            <p className="text-xs text-muted-foreground">{org.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (org: Organization) => (
        <Badge className={statusColors[org.status]}>{statusLabels[org.status]}</Badge>
      ),
    },
    {
      key: 'tier',
      header: 'Plano',
      cell: (org: Organization) => {
        const tier = (org.plan ?? org.tier) as OrgTier;
        return tier ? (
          <Badge className={tierColors[tier]}>{tierLabels[tier]}</Badge>
        ) : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'members',
      header: 'Membros',
      cell: (org: Organization) => (
        <span className="text-muted-foreground">{org.memberCount ?? 0}</span>
      ),
    },
    {
      key: 'mrr',
      header: 'MRR',
      cell: (org: Organization) => (
        <span className="font-mono text-foreground">
          R$ {(org.mrr ?? 0).toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'healthScore',
      header: 'Saúde',
      cell: (org: Organization) => {
        const score = org.healthScore ?? 0;
        const color =
          score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
        return <span className={`font-mono ${color}`}>{score}%</span>;
      },
    },
    {
      key: 'lastActive',
      header: 'Último Acesso',
      cell: (org: Organization) =>
        org.lastActiveAt ? (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(new Date(org.lastActiveAt), { addSuffix: true, locale: ptBR })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      cell: (org: Organization) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedOrg(org);
                setDetailsDialogOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {org.status === 'active' ? (
              <DropdownMenuItem className="text-warning">
                <Ban className="mr-2 h-4 w-4" />
                Suspender
              </DropdownMenuItem>
            ) : org.status === 'suspended' ? (
              <DropdownMenuItem className="text-success">
                <CheckCircle className="mr-2 h-4 w-4" />
                Reativar
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Ativo' },
        { value: 'suspended', label: 'Suspenso' },
        { value: 'churned', label: 'Cancelado' },
        { value: 'trial', label: 'Trial' },
      ],
    },
    {
      key: 'plan',
      label: 'Plano',
      options: [
        { value: 'free', label: 'Gratuito' },
        { value: 'basic', label: 'Básico' },
        { value: 'pro', label: 'Pro' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organizações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as organizações da plataforma
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Organização
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Organizações
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '—' : `R$ ${stats.totalMRR.toLocaleString('pt-BR')}`}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Membros
            </CardTitle>
            <Users className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '—' : stats.totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              data={organizations}
              columns={columns}
              searchPlaceholder="Buscar organizações..."
              searchKey="name"
              filters={filters}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nova Organização */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Organização</DialogTitle>
            <DialogDescription>
              Adicione uma nova organização à plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Nome da organização" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="slug-da-organizacao" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tier">Plano</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domínio</Label>
              <Input id="domain" placeholder="exemplo.com.br" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setCreateDialogOpen(false)}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes da Organização */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
            <DialogDescription>{selectedOrg?.domain ?? selectedOrg?.slug}</DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedOrg.status]}>
                    {statusLabels[selectedOrg.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  {(() => {
                    const tier = (selectedOrg.plan ?? selectedOrg.tier) as OrgTier;
                    return tier ? (
                      <Badge className={tierColors[tier]}>{tierLabels[tier]}</Badge>
                    ) : null;
                  })()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Membros</p>
                  <p className="font-medium">{selectedOrg.memberCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="font-mono font-medium">
                    R$ {(selectedOrg.mrr ?? 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pontuação de Saúde</p>
                  <p className="font-medium">{selectedOrg.healthScore ?? 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pontuação de Conformidade</p>
                  <p className="font-medium">{selectedOrg.complianceScore ?? 0}%</p>
                </div>
                {selectedOrg.industry && (
                  <div>
                    <p className="text-sm text-muted-foreground">Setor</p>
                    <p className="font-medium">{selectedOrg.industry}</p>
                  </div>
                )}
                {selectedOrg.country && (
                  <div>
                    <p className="text-sm text-muted-foreground">País</p>
                    <p className="font-medium">{selectedOrg.country}</p>
                  </div>
                )}
              </div>
              {selectedOrg.featureFlags && selectedOrg.featureFlags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Feature Flags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrg.featureFlags.map((flag) => (
                      <Badge key={flag} variant="secondary">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fechar
            </Button>
            <Button>Editar Organização</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
