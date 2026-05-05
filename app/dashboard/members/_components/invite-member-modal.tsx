'use client';

import { Loader2 } from 'lucide-react';
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
import type { MemberRole } from '@/lib/types';

interface InviteForm {
  email: string;
  fullName: string;
  orgId: string;
  role: MemberRole;
}

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: InviteForm;
  onFormChange: (form: InviteForm) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  orgList: Array<{ id: string; name: string }>;
}

export function InviteMemberModal({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
  error,
  orgList,
}: InviteMemberModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>Adicione um novo membro a uma organização.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="nome@empresa.com"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-name">Nome Completo</Label>
            <Input
              id="invite-name"
              placeholder="Nome do membro"
              value={form.fullName}
              onChange={(e) => onFormChange({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-org">Organização</Label>
            <Select value={form.orgId} onValueChange={(v) => onFormChange({ ...form, orgId: v })}>
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
            <Select value={form.role} onValueChange={(v) => onFormChange({ ...form, role: v as MemberRole })}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
