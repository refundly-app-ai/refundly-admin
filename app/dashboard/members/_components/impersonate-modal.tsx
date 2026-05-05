'use client';

import { Loader2, ExternalLink } from 'lucide-react';
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
import type { Member } from '@/lib/types';

interface ImpersonateModalProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  link: string | null;
}

export function ImpersonateModal({
  member,
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onSubmit,
  isSubmitting,
  error,
  link,
}: ImpersonateModalProps) {
  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      onReasonChange('');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Personificar Usuário</DialogTitle>
          <DialogDescription>
            Você está prestes a personificar {member?.name}. Esta ação será registrada.
          </DialogDescription>
        </DialogHeader>

        {link ? (
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
                onClick={() => window.open(link, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir como {member?.name}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="impersonate-reason">Motivo da personificação</Label>
              <Input
                id="impersonate-reason"
                placeholder="Ticket de suporte #1234"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {link ? 'Fechar' : 'Cancelar'}
          </Button>
          {!link && (
            <Button
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={onSubmit}
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Personificação
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
