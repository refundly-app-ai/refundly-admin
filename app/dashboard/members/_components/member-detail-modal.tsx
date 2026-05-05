'use client';

import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { Member, MemberRole, MemberStatus } from '@/lib/types';

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

interface EditForm {
  fullName: string;
  email: string;
  role: MemberRole;
}

interface MemberDetailModalProps {
  member: Member | null;
  detailsOpen: boolean;
  onDetailsOpenChange: (open: boolean) => void;
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  editForm: EditForm;
  onEditFormChange: (form: EditForm) => void;
  onEditSubmit: () => void;
  isEditing: boolean;
  editError: string | null;
  onOpenEdit: (member: Member) => void;
}

export function MemberDetailModal({
  member,
  detailsOpen,
  onDetailsOpenChange,
  editOpen,
  onEditOpenChange,
  editForm,
  onEditFormChange,
  onEditSubmit,
  isEditing,
  editError,
  onOpenEdit,
}: MemberDetailModalProps) {
  return (
    <>
      <Dialog open={detailsOpen} onOpenChange={onDetailsOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{member?.name}</DialogTitle>
            <DialogDescription>{member?.email}</DialogDescription>
          </DialogHeader>
          {member && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {member.status && (
                    <Badge className={statusColors[member.status as MemberStatus]}>
                      {statusLabels[member.status as MemberStatus]}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Papel</p>
                  {member.role && (
                    <Badge className={roleColors[member.role as MemberRole]}>
                      {roleLabels[member.role as MemberRole]}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organização</p>
                  <p className="font-medium">{member.organizationName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{member.mfaEnabled ? 'Verificado' : 'Não verificado'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onDetailsOpenChange(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                onDetailsOpenChange(false);
                if (member) onOpenEdit(member);
              }}
            >
              Editar Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>{member?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                value={editForm.fullName}
                onChange={(e) => onEditFormChange({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => onEditFormChange({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Papel na Organização</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => onEditFormChange({ ...editForm, role: v as MemberRole })}
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
            <Button variant="outline" onClick={() => onEditOpenChange(false)} disabled={isEditing}>
              Cancelar
            </Button>
            <Button onClick={onEditSubmit} disabled={isEditing}>
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
