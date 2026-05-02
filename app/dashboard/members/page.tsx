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
  ExternalLink,
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
  admin: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  colaborador: 'bg-muted text-muted-foreground',
  aprovador: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
};

const roleLabels: Record<MemberRole, string> = {
  admin: 'Admin',
  colaborador: 'Colaborador',
  aprovador: 'Aprovador',
};

interface InviteForm {
  email: string;
  fullName: string;
  orgId: string;
  role: MemberRole;
}

interface EditForm {
  fullName: string;
  email: string;
  role: MemberRole;
}

export default function MembersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [inviteForm, setInviteForm] = useState<InviteForm>({ email: '', fullName: '', orgId: '', role: 'colaborador' });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const [editForm, setEditForm] = useState<EditForm>({ fullName: '', email: '', role: 'colaborador' });

  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [impersonateReason, setImpersonateReason] = useState('');
  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const [impersonateLink, setImpersonateLink] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const { data: membersData, isLoading: membersLoading, mutate } = useSWR('/api/members?limit=100', fetcher);
  const { data: orgsData } = useSWR('/api/organizations?limit=100', fetcher);

  const members: Member[] = (membersData?.data?.items ?? []).map((m: Record<string, unknown>): Member => ({
    id: m.id as string,
    email: m.email as string,
    name: (m.fullName as string) || (m.email as string),
    fullName: m.fullName as string | undefined,
    organizationId: m.orgId as string | undefined,
    organizationName: m.orgName as string | undefined,
    role: m.role as MemberRole | undefined,
    status: ((m.isActive as boolean) !== false ? 'active' : 'suspended') as MemberStatus,
    banned: (m.isActive as boolean) === false,
    mfaEnabled: (m.whatsappVerified as boolean) ?? false,
    createdAt: new Date().toISOString(),
  }));

  const orgList: Array<{ id: string; name: string }> = (orgsData?.data?.items ?? []).map((o: Record<string, unknown>) => ({
    id: String(o.id ?? ''),
    name: String(o.name ?? ''),
  }));

  const stats = {
    total: membersData?.data?.pagination?.total ?? members.length,
    active: members.filter((m) => m.status === 'active').length,
    mfaEnabled: members.filter((m) => m.mfaEnabled).length,
    admins: members.filter((m) => m.role === 'admin').length,
  };

  async function handleInvite() {
    setInviteError(null);
    if (!inviteForm.email) { setInviteError('E-mail é obrigatório'); return; }
    if (!inviteForm.fullName) { setInviteError('Nome é obrigatório'); return; }
    if (!inviteForm.orgId) { setInviteError('Selecione uma organização'); return; }

    setIsInviting(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const result = await res.json();
      if (result.ok) {
        setInviteDialogOpen(false);
        setInviteForm({ email: '', fullName: '', orgId: '', role: 'member' });
        mutate();
      } else {
        setInviteError(result.error ?? 'Erro ao convidar membro');
      }
    } catch {
      setInviteError('Erro de conexão. Tente novamente.');
    } finally {
      setIsInviting(false);
    }
  }

  function openEditDialog(member: Member) {
    setEditForm({ fullName: member.fullName ?? member.name ?? '', email: member.email, role: member.role ?? 'colaborador' });
    setEditError(null);
    setSelectedMember(member);
    setEditDialogOpen(true);
  }

  async function handleEdit() {
    if (!selectedMember) return;
    setEditError(null);

    setIsEditing(true);
    try {
      const body: Record<string, unknown> = {};
      if (editForm.fullName && editForm.fullName !== (selectedMember.fullName ?? selectedMember.name)) {
        body.fullName = editForm.fullName;
      }
      if (editForm.email && editForm.email !== selectedMember.email) {
        body.email = editForm.email;
      }
      if (editForm.role && editForm.role !== selectedMember.role) {
        body.role = editForm.role;
        body.orgId = selectedMember.organizationId;
      }

      if (Object.keys(body).length === 0) {
        setEditDialogOpen(false);
        return;
      }

      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.ok) {
        setEditDialogOpen(false);
        mutate();
      } else {
        setEditError(result.error ?? 'Erro ao editar membro');
      }
    } catch {
      setEditError('Erro de conexão. Tente novamente.');
    } finally {
      setIsEditing(false);
    }
  }

  function openImpersonateDialog(member: Member) {
    setSelectedMember(member);
    setImpersonateReason('');
    setImpersonateError(null);
    setImpersonateLink(null);
    setImpersonateDialogOpen(true);
  }

  async function handleImpersonate() {
    if (!selectedMember) return;
    setImpersonateError(null);

    setIsImpersonating(true);
    try {
      const res = await fetch(`/api/members/${selectedMember.id}/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: impersonateReason }),
      });
      const result = await res.json();
      if (result.ok) {
        setImpersonateLink(result.data.link);
      } else {
        setImpersonateError(result.error ?? 'Erro ao iniciar personificação');
      }
    } catch {
      setImpersonateError('Erro de conexão. Tente novamente.');
    } finally {
      setIsImpersonating(false);
    }
  }

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
        member.role !== 'colaborador' ? (
          <span className="text-muted-foreground">—</span>
        ) : member.mfaEnabled ? (
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
            <DropdownMenuItem onClick={() => openEditDialog(member)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openImpersonateDialog(member)}>
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
      key: 'role',
      label: 'Papel',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'colaborador', label: 'Colaborador' },
        { value: 'aprovador', label: 'Aprovador' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Ativo' },
        { value: 'suspended', label: 'Suspenso' },
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
        <Button onClick={() => { setInviteError(null); setInviteDialogOpen(true); }}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersLoading ? '—' : stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp Verificado</CardTitle>
            <Shield className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersLoading ? '—' : stats.mfaEnabled}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <Key className="h-4 w-4 text-chart-3" />
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
              Adicione um novo membro a uma organização.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="nome@empresa.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-name">Nome Completo</Label>
              <Input
                id="invite-name"
                placeholder="Nome do membro"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-org">Organização</Label>
              <Select
                value={inviteForm.orgId}
                onValueChange={(v) => setInviteForm((f) => ({ ...f, orgId: v }))}
              >
                <SelectTrigger id="invite-org">
                  <SelectValue placeholder="Selecione a organização" />
                </SelectTrigger>
                <SelectContent>
                  {orgList.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Papel</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v as MemberRole }))}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="aprovador">Aprovador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={isInviting}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Convite
            </Button>
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
            <Button onClick={() => { setDetailsDialogOpen(false); if (selectedMember) openEditDialog(selectedMember); }}>
              Editar Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Membro */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>{selectedMember?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editForm.fullName}
                onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Papel na Organização</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as MemberRole }))}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="aprovador">Aprovador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isEditing}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Personificar */}
      <Dialog open={impersonateDialogOpen} onOpenChange={(open) => {
        setImpersonateDialogOpen(open);
        if (!open) { setImpersonateLink(null); setImpersonateReason(''); setImpersonateError(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personificar Usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a personificar {selectedMember?.name}. Esta ação será registrada.
            </DialogDescription>
          </DialogHeader>

          {impersonateLink ? (
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border border-success/50 bg-success/10 p-3">
                <p className="text-sm text-success font-medium mb-2">Link gerado com sucesso</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Este link expira em 1 hora e concede acesso como o usuário. Abra em uma janela anônima.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(impersonateLink, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir como {selectedMember?.name}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              {impersonateError && <p className="text-sm text-destructive">{impersonateError}</p>}
              <div className="grid gap-2">
                <Label htmlFor="impersonate-reason">Motivo da personificação</Label>
                <Input
                  id="impersonate-reason"
                  placeholder="Ticket de suporte #1234"
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                />
              </div>
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
                <p className="text-sm text-warning">
                  Sessões de personificação são registradas e auditadas. Use este recurso apenas para fins legítimos de suporte.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateDialogOpen(false)}>
              {impersonateLink ? 'Fechar' : 'Cancelar'}
            </Button>
            {!impersonateLink && (
              <Button
                className="bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={handleImpersonate}
                disabled={!impersonateReason.trim() || isImpersonating}
              >
                {isImpersonating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Personificação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
