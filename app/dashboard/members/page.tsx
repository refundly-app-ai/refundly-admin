'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  Shield,
  Key,
  UserCog,
  Loader2,
} from 'lucide-react';
import { MembersStatsCards } from './_components/members-stats-cards';
import { InviteMemberModal } from './_components/invite-member-modal';
import { MemberDetailModal } from './_components/member-detail-modal';
import { ImpersonateModal } from './_components/impersonate-modal';

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

  const queryClient = useQueryClient();
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members?limit=100').then((r) => r.json()),
  });
  const { data: orgsData } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: () => fetch('/api/organizations?limit=100').then((r) => r.json()),
  });

  function mutate() { queryClient.invalidateQueries({ queryKey: ['members'] }); }

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
        setInviteForm({ email: '', fullName: '', orgId: '', role: 'colaborador' });
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
      if (editForm.fullName && editForm.fullName !== (selectedMember.fullName ?? selectedMember.name)) body.fullName = editForm.fullName;
      if (editForm.email && editForm.email !== selectedMember.email) body.email = editForm.email;
      if (editForm.role && editForm.role !== selectedMember.role) { body.role = editForm.role; body.orgId = selectedMember.organizationId; }
      if (Object.keys(body).length === 0) { setEditDialogOpen(false); return; }
      const res = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.ok) { setEditDialogOpen(false); mutate(); }
      else { setEditError(result.error ?? 'Erro ao editar membro'); }
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
      if (result.ok) { setImpersonateLink(result.data.link); }
      else { setImpersonateError(result.error ?? 'Erro ao iniciar personificação'); }
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
      cell: (member: Member) => <span className="text-muted-foreground">{member.organizationName ?? '—'}</span>,
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
          <Badge variant="outline" className="text-muted-foreground">Não verificado</Badge>
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
            <DropdownMenuItem onClick={() => { setSelectedMember(member); setDetailsDialogOpen(true); }}>
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
          <p className="text-sm text-muted-foreground">Gerencie todos os membros da plataforma</p>
        </div>
        <Button onClick={() => { setInviteError(null); setInviteDialogOpen(true); }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </div>

      <MembersStatsCards stats={stats} isLoading={membersLoading} />

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-2 py-3 border-b border-border last:border-0">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
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

      <InviteMemberModal
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        form={inviteForm}
        onFormChange={setInviteForm}
        onSubmit={handleInvite}
        isSubmitting={isInviting}
        error={inviteError}
        orgList={orgList}
      />

      <MemberDetailModal
        member={selectedMember}
        detailsOpen={detailsDialogOpen}
        onDetailsOpenChange={setDetailsDialogOpen}
        editOpen={editDialogOpen}
        onEditOpenChange={setEditDialogOpen}
        editForm={editForm}
        onEditFormChange={setEditForm}
        onEditSubmit={handleEdit}
        isEditing={isEditing}
        editError={editError}
        onOpenEdit={openEditDialog}
      />

      <ImpersonateModal
        member={selectedMember}
        open={impersonateDialogOpen}
        onOpenChange={(open) => {
          setImpersonateDialogOpen(open);
          if (!open) { setImpersonateLink(null); setImpersonateError(null); }
        }}
        reason={impersonateReason}
        onReasonChange={setImpersonateReason}
        onSubmit={handleImpersonate}
        isSubmitting={isImpersonating}
        error={impersonateError}
        link={impersonateLink}
      />
    </div>
  );
}
