'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Shield,
  ShieldOff,
  RotateCcw,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Admin {
  id: string;
  email: string;
  fullName: string;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  isActive: boolean;
  createdAt: string;
  isSelf: boolean;
}

export default function SettingsAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Convidar
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Resultado do convite
  const [createdAdmin, setCreatedAdmin] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Confirmações
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'revoke' | 'reactivate' | 'reset-2fa' | 'delete';
    admin: Admin;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function fetchAdmins() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admins');
      const result = await res.json();
      if (result.ok) {
        setAdmins(result.data);
      } else {
        setError(result.error || 'Erro ao carregar administradores');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return;
    setIsSubmitting(true);
    setInviteError('');

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, fullName: inviteName }),
      });
      const result = await res.json();

      if (result.ok) {
        setCreatedAdmin({ email: result.data.admin.email, tempPassword: result.data.tempPassword });
        setInviteDialog(false);
        setInviteEmail('');
        setInviteName('');
        await fetchAdmins();
      } else {
        setInviteError(result.error || 'Erro ao convidar admin');
      }
    } catch {
      setInviteError('Erro de conexão');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function executeAction() {
    if (!confirmDialog) return;
    setIsProcessing(true);

    try {
      const { type, admin } = confirmDialog;
      let res: Response;

      if (type === 'revoke' || type === 'reactivate') {
        res = await fetch(`/api/admins/${admin.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: type === 'reactivate' }),
        });
      } else if (type === 'reset-2fa') {
        res = await fetch(`/api/admins/${admin.id}/reset-2fa`, { method: 'POST' });
      } else {
        res = await fetch(`/api/admins/${admin.id}`, { method: 'DELETE' });
      }

      const result = await res.json();
      if (result.ok) {
        await fetchAdmins();
        setConfirmDialog(null);
      } else {
        setError(result.error || 'Erro ao executar ação');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setIsProcessing(false);
    }
  }

  function copyPassword() {
    if (!createdAdmin) return;
    navigator.clipboard.writeText(createdAdmin.tempPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeAdmins = admins.filter((a) => a.isActive);
  const inactiveAdmins = admins.filter((a) => !a.isActive);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Administradores</h1>
          <p className="text-muted-foreground">Gerencie os administradores da plataforma</p>
        </div>
        <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Convidar Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Administrador</DialogTitle>
              <DialogDescription>
                Uma senha temporária será gerada. Compartilhe com o novo admin para o primeiro acesso.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              {inviteError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail || !inviteName || isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{admins.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-success">{activeAdmins.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com 2FA</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {admins.filter((a) => a.totpEnabled).length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Admins Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Administradores Ativos</CardTitle>
          <CardDescription>Usuários com acesso ao painel administrativo</CardDescription>
        </CardHeader>
        <CardContent>
          {activeAdmins.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum admin ativo</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrador</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {admin.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {admin.fullName}
                            {admin.isSelf && <Badge variant="outline" className="ml-2 text-xs">Você</Badge>}
                          </p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.totpEnabled ? (
                        <Badge className="bg-success/10 text-success gap-1">
                          <Shield className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-warning">
                          <ShieldOff className="h-3 w-3" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.lastLoginAt ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(admin.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      ) : (
                        <span>Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-success/10 text-success gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!admin.isSelf && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {admin.totpEnabled && (
                              <DropdownMenuItem
                                onClick={() => setConfirmDialog({ type: 'reset-2fa', admin })}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Resetar 2FA
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setConfirmDialog({ type: 'revoke', admin })}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Revogar Acesso
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setConfirmDialog({ type: 'delete', admin })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Admins Inativos */}
      {inactiveAdmins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Administradores Inativos</CardTitle>
            <CardDescription>Usuários com acesso revogado</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrador</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveAdmins.map((admin) => (
                  <TableRow key={admin.id} className="opacity-60">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {admin.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.fullName}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.lastLoginAt
                        ? format(new Date(admin.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <XCircle className="h-3 w-3" />
                        Inativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDialog({ type: 'reactivate', admin })}
                        >
                          Reativar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setConfirmDialog({ type: 'delete', admin })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Diálogo: senha temporária do novo admin */}
      <Dialog
        open={!!createdAdmin}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedAdmin(null);
            setCopiedPassword(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin criado com sucesso</DialogTitle>
            <DialogDescription>
              Compartilhe a senha temporária abaixo com {createdAdmin?.email}. Ela não será mostrada novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No primeiro login, o admin precisará configurar a 2FA e alterar a senha.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Senha temporária</Label>
              <div className="flex gap-2">
                <Input readOnly value={createdAdmin?.tempPassword ?? ''} className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyPassword}>
                  {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedAdmin(null)}>Concluído</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmações de ação */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === 'revoke' && 'Revogar acesso?'}
              {confirmDialog?.type === 'reactivate' && 'Reativar acesso?'}
              {confirmDialog?.type === 'reset-2fa' && 'Resetar 2FA?'}
              {confirmDialog?.type === 'delete' && 'Remover admin?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === 'revoke' &&
                `${confirmDialog.admin.fullName} não poderá mais acessar o painel até ser reativado.`}
              {confirmDialog?.type === 'reactivate' &&
                `${confirmDialog.admin.fullName} voltará a ter acesso ao painel.`}
              {confirmDialog?.type === 'reset-2fa' &&
                `O 2FA de ${confirmDialog.admin.fullName} será removido. Ele precisará configurar novamente no próximo login.`}
              {confirmDialog?.type === 'delete' &&
                `Esta ação remove permanentemente ${confirmDialog.admin.fullName} dos administradores. Não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={isProcessing}
              className={confirmDialog?.type === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
