'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Users,
  Plus,
  Shield,
  ShieldOff,
  RotateCcw,
  Trash2,
  Loader2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal } from 'lucide-react';

interface Admin {
  id: string;
  email: string;
  fullName: string;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  isActive: boolean;
}

// Mock admins data
const mockAdmins: Admin[] = [
  {
    id: 'admin_1',
    email: 'admin@example.com',
    fullName: 'Super Admin',
    totpEnabled: true,
    lastLoginAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'admin_2',
    email: 'ops@example.com',
    fullName: 'Operations Admin',
    totpEnabled: false,
    lastLoginAt: null,
    isActive: true,
  },
  {
    id: 'admin_3',
    email: 'support@example.com',
    fullName: 'Support Admin',
    totpEnabled: true,
    lastLoginAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isActive: true,
  },
  {
    id: 'admin_4',
    email: 'inactive@example.com',
    fullName: 'Inactive Admin',
    totpEnabled: true,
    lastLoginAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    isActive: false,
  },
];

export default function SettingsAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>(mockAdmins);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return;
    setIsSubmitting(true);

    // Simulate invite
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newAdmin: Admin = {
      id: `admin_${Date.now()}`,
      email: inviteEmail,
      fullName: inviteName,
      totpEnabled: false,
      lastLoginAt: null,
      isActive: true,
    };

    setAdmins([...admins, newAdmin]);
    setInviteDialog(false);
    setInviteEmail('');
    setInviteName('');
    setIsSubmitting(false);
  }

  function handleRevoke(adminId: string) {
    setAdmins(admins.map(a => a.id === adminId ? { ...a, isActive: false } : a));
  }

  function handleReactivate(adminId: string) {
    setAdmins(admins.map(a => a.id === adminId ? { ...a, isActive: true } : a));
  }

  function handleReset2FA(adminId: string) {
    setAdmins(admins.map(a => a.id === adminId ? { ...a, totpEnabled: false } : a));
  }

  const activeAdmins = admins.filter(a => a.isActive);
  const inactiveAdmins = admins.filter(a => !a.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
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
                Um convite será enviado para o e-mail informado.
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail || !inviteName || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar Convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{admins.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-success">{activeAdmins.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com 2FA Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {admins.filter(a => a.totpEnabled).length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Active Admins */}
      <Card>
        <CardHeader>
          <CardTitle>Administradores Ativos</CardTitle>
          <CardDescription>Usuários com acesso ao painel administrativo</CardDescription>
        </CardHeader>
        <CardContent>
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
                          {admin.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{admin.fullName}</p>
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
                        {format(new Date(admin.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-success/10 text-success gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Ativo
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleReset2FA(admin.id)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Resetar 2FA
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRevoke(admin.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Revogar Acesso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inactive Admins */}
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
                            {admin.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                        ? format(new Date(admin.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <XCircle className="h-3 w-3" />
                        Inativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReactivate(admin.id)}
                      >
                        Reativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
