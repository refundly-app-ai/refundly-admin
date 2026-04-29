'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  Building2,
  Activity,
  Monitor,
  Shield,
  Loader2,
  AlertTriangle,
  Ban,
  RotateCcw,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Member, Activity as ActivityType } from '@/lib/types';

interface Session {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface MemberDetailData {
  member: Member;
  activities: ActivityType[];
  sessions: Session[];
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<MemberDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [banDialog, setBanDialog] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/members/${params.id}`);
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

  async function handleBan() {
    if (!data) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/members/${params.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason }),
      });

      const result = await res.json();
      if (result.ok) {
        setData({ ...data, member: { ...data.member, banned: true } });
        setBanDialog(false);
        setBanReason('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnban() {
    if (!data) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/members/${params.id}/ban`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (result.ok) {
        setData({ ...data, member: { ...data.member, banned: false } });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForceReset() {
    if (!data) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/members/${params.id}/force-reset`, {
        method: 'POST',
      });

      const result = await res.json();
      if (result.ok) {
        setResetDialog(false);
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
        <p className="text-lg font-medium">{error || 'Membro não encontrado'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const { member, activities, sessions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{member.fullName}</h1>
              {member.banned && (
                <Badge variant="destructive">Banido</Badge>
              )}
              {member.verifiedChannel && (
                <Badge className="bg-success/10 text-success">Verificado</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{member.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setResetDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Forçar Reset de Senha
          </Button>
          {member.banned ? (
            <Button variant="outline" onClick={handleUnban} disabled={isSubmitting}>
              <Shield className="h-4 w-4 mr-2" />
              Remover Ban
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setBanDialog(true)}>
              <Ban className="h-4 w-4 mr-2" />
              Banir Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organizações</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{member.orgs.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{activities.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{sessions.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Último Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-medium">
              {member.lastSignInAt
                ? format(new Date(member.lastSignInAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                : 'Nunca'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orgs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orgs" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organizações
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Monitor className="h-4 w-4" />
            Sessões
          </TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="orgs">
          <Card>
            <CardHeader>
              <CardTitle>Organizações</CardTitle>
              <CardDescription>Organizações das quais este membro faz parte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {member.orgs.map((org) => (
                  <div
                    key={org.orgId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/organizations/${org.orgId}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{org.orgName}</p>
                        <p className="text-sm text-muted-foreground font-mono">{org.orgId}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{org.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Atividade</CardTitle>
              <CardDescription>Histórico completo de ações deste membro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.slice(0, 50).map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {index < activities.length - 1 && (
                        <div className="flex-1 w-px bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.entity} {activity.entityId && `- ${activity.entityId}`}
                          </p>
                          {activity.orgId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Org: {activity.orgId}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(activity.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.createdAt), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <pre className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessões Ativas</CardTitle>
              <CardDescription>Dispositivos e sessões conectadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{session.device}</p>
                            {session.current && (
                              <Badge variant="outline" className="text-xs">Sessão atual</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{session.ip}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(session.lastActive), "dd/MM HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban Dialog */}
      <Dialog open={banDialog} onOpenChange={setBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
            <DialogDescription>
              Esta ação irá bloquear o acesso deste usuário em todas as organizações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do banimento</Label>
              <Textarea
                placeholder="Descreva o motivo..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={!banReason || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Banir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Reset Dialog */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forçar Reset de Senha</DialogTitle>
            <DialogDescription>
              Um e-mail será enviado para {member.email} com instruções para redefinir a senha.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleForceReset} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar E-mail de Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
