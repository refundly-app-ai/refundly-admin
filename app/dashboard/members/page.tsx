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
import type { Member, MemberRole, MemberStatus } from '@/lib/types';
import {
  MoreHorizontal,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Users,
  Shield,
  Key,
  UserCog,
  Loader2,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusColors: Record<MemberStatus, string> = {
  active: 'bg-success/20 text-success border-success/30',
  invited: 'bg-info/20 text-info border-info/30',
  suspended: 'bg-warning/20 text-warning border-warning/30',
  deactivated: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<MemberStatus, string> = {
  active: 'Ativo',
  invited: 'Convidado',
  suspended: 'Suspenso',
  deactivated: 'Desativado',
};

const roleColors: Record<MemberRole, string> = {
  owner: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  admin: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  member: 'bg-muted text-muted-foreground',
  viewer: 'bg-muted text-muted-foreground',
};

const roleLabels: Record<MemberRole, string> = {
  owner: 'Proprietário',
  admin: 'Admin',
  member: 'Membro',
  viewer: 'Visualizador',
};

export default function MembersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);

  const { data: membersData, isLoading: membersLoading } = useSWR('/api/members?limit=100', fetcher);
  const { data: orgsData } = useSWR('/api/organizations?limit=100', fetcher);

  const members: Member[] = (membersData?.data?.items ?? []).map((m: any) => ({
    id: m.id,
    email: m.email,
    name: m.fullName || m.email,
    fullName: m.fullName,
    organizationId: m.orgId,
    organizationName: m.orgName,
    role: m.role as MemberRole,
    status: (m.banned ? 'suspended' : 'active') as MemberStatus,
    banned: m.banned ?? false,
    mfaEnabled: m.whatsappVerified ?? false,
    createdAt: new Date().toISOString(),
  }));

  const orgList: Array<{ id: string; name: string }> = (orgsData?.data?.items ?? []).map((o: any) => ({
    id: o.id,
    name: o.name,
  }));

  const stats = {
    total: membersData?.data?.pagination?.total ?? members.length,
    active: members.filter((m) => !m.banned).length,
    mfaEnabled: members.filter((m) => m.mfaEnabled).length,
    admins: members.filter((m) => m.role === 'admin' || m.role === 'owner').length,
  };

  const columns = [
    {
      key: 'name',
      header: 'Membro',
      cell: (member: Member) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {(member.name || member.email).split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{member.name ?? member.email}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organização',
      cell: (member: Member) => (
        <span className="text-muted-foreground">{member.organizationName ?? '—'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      cell: (member: Member) =>
        member.role ? (
          <Badge className={roleColors[member.role as MemberRole]}>{roleLabels[member.role as MemberRole]}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (member: Member) =>
        member.status ? (
          <Badge className={statusColors[member.status as MemberStatus]}>{statusLabels[member.status as MemberStatus]}</Badge>
        ) : null,
    },
    {
      key: 'mfa',
      header: 'WhatsApp',
      cell: (member: Member) =>
        member.mfaEnabled ? (
          <Badge className="bg-success/20 text-success border-success/30">
            <Shield className="mr-1 h-3 w-3" />
            Verificado
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Não verificado
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      cell: (member: Member) => (
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
                setSelectedMember(member);
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
            <DropdownMenuItem
              onClick={() => {
                setSelectedMember(member);
                setImpersonateDialogOpen(true);
              }}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Personificar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="mr-2 h-4 w-4" />
              Resetar Senha
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {member.status === 'active' ? (
              <DropdownMenuItem className="text-warning">
                <Ban className="mr-2 h-4 w-4" />
                Suspender
              </DropdownMenuItem>
            ) : member.status === 'suspended' ? (
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
        { value: 'invited', label: 'Convidado' },
        { value: 'suspended', label: 'Suspenso' },
        { value: 'deactivated', label: 'Desativado' },
      ],
    },
    {
      key: 'role',
      label: 'Papel',
      options: [
        { value: 'owner', label: 'Proprietário' },
        { value: 'admin', label: 'Admin' },
        { value: 'member', label: 'Membro' },
        { value: 'viewer', label: 'Visualizador' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Membros</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os membros da plataforma
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Membros
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {membersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersLoading ? '—' : stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              WhatsApp Verificado
            </CardTitle>
            <Shield className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersLoading ? '—' : stats.mfaEnabled}</div>
            {!membersLoading && stats.total > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.mfaEnabled / stats.total) * 100)}% do total
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins e Proprietários
            </CardTitle>
            <UserCog className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersLoading ? '—' : stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {membersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              data={members}
              columns={columns}
              searchPlaceholder="Buscar membros..."
              searchKey="name"
              filters={filters}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog: Convidar Membro */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>
              Envie um convite para um novo membro.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="email@exemplo.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization">Organização</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma organização" />
                </SelectTrigger>
                <SelectContent>
                  {orgList.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Papel</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setInviteDialogOpen(false)}>Enviar Convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Membro */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMember?.name}</DialogTitle>
            <DialogDescription>{selectedMember?.email}</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {selectedMember.status && (
                    <Badge className={statusColors[selectedMember.status as MemberStatus]}>
                      {statusLabels[selectedMember.status as MemberStatus]}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Papel</p>
                  {selectedMember.role && (
                    <Badge className={roleColors[selectedMember.role as MemberRole]}>
                      {roleLabels[selectedMember.role as MemberRole]}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organização</p>
                  <p className="font-medium">{selectedMember.organizationName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">
                    {selectedMember.mfaEnabled ? 'Verificado' : 'Não verificado'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fechar
            </Button>
            <Button>Editar Membro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Personificar */}
      <Dialog open={impersonateDialogOpen} onOpenChange={setImpersonateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personificar Usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a personificar {selectedMember?.name}. Esta ação será registrada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo da personificação</Label>
              <Input id="reason" placeholder="Ticket de suporte #1234" />
            </div>
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
              <p className="text-sm text-warning">
                Sessões de personificação são registradas e auditadas. Use este recurso apenas para fins legítimos de suporte.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={() => setImpersonateDialogOpen(false)}
            >
              Iniciar Personificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
