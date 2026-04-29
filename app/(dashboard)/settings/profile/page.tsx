'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Shield,
  Key,
  Monitor,
  Download,
  RotateCcw,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  MapPin,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Session {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

// Mock current admin
const mockAdmin = {
  id: 'admin_1',
  email: 'admin@example.com',
  fullName: 'Super Admin',
  totpEnabled: true,
  lastLoginAt: new Date().toISOString(),
};

// Mock sessions
const mockSessions: Session[] = [
  {
    id: 'sess_1',
    device: 'Chrome on macOS',
    ip: '192.168.1.1',
    location: 'São Paulo, BR',
    lastActive: new Date().toISOString(),
    current: true,
  },
  {
    id: 'sess_2',
    device: 'Safari on iOS',
    ip: '192.168.1.2',
    location: 'São Paulo, BR',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    current: false,
  },
  {
    id: 'sess_3',
    device: 'Firefox on Windows',
    ip: '10.0.0.1',
    location: 'Rio de Janeiro, BR',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    current: false,
  },
];

// Mock recovery codes
const mockRecoveryCodes = [
  'AAAA1111BBBB',
  'CCCC2222DDDD',
  'EEEE3333FFFF',
  'GGGG4444HHHH',
  'IIII5555JJJJ',
];

export default function SettingsProfilePage() {
  const [admin] = useState(mockAdmin);
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>(mockRecoveryCodes);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA regenerate
  const [regenerate2FADialog, setRegenerate2FADialog] = useState(false);
  const [newTotpUri, setNewTotpUri] = useState('');
  const [newTotpSecret, setNewTotpSecret] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Recovery codes
  const [regenerateCodesDialog, setRegenerateCodesDialog] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) return;
    setIsChangingPassword(true);

    // Simulate password change
    await new Promise(resolve => setTimeout(resolve, 1500));

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
  }

  async function handleRegenerate2FA() {
    setIsRegenerating(true);

    try {
      const res = await fetch('/api/auth/setup-2fa');
      const result = await res.json();

      if (result.ok) {
        setNewTotpUri(result.data.uri);
        setNewTotpSecret(result.data.secret);
        setNewRecoveryCodes(result.data.recoveryCodes);
        setRegenerate2FADialog(true);
      }
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleRegenerateRecoveryCodes() {
    // Generate new codes
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 12; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    setNewRecoveryCodes(codes);
    setRegenerateCodesDialog(true);
  }

  function downloadRecoveryCodes(codes: string[]) {
    const content = codes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copySecret() {
    navigator.clipboard.writeText(newTotpSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevokeSession(sessionId: string) {
    setSessions(sessions.filter(s => s.id !== sessionId));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas configurações de conta e segurança</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Informações do Perfil</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Nome</Label>
              <p className="font-medium">{admin.fullName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">E-mail</Label>
              <p className="font-medium">{admin.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Último Login</Label>
              <p className="font-medium">
                {admin.lastLoginAt
                  ? format(new Date(admin.lastLoginAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                  : 'Nunca'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">2FA</Label>
              <div className="flex items-center gap-2">
                {admin.totpEnabled ? (
                  <Badge className="bg-success/10 text-success">
                    <Shield className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-warning">
                    Não configurado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Alterar Senha</CardTitle>
          </div>
          <CardDescription>Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-destructive">As senhas não coincidem</p>
          )}
          <Button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isChangingPassword}
          >
            {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* 2FA Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Autenticação em Duas Etapas</CardTitle>
          </div>
          <CardDescription>Gerencie seu autenticador TOTP e códigos de recuperação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Autenticador TOTP</p>
              <p className="text-sm text-muted-foreground">
                Use um aplicativo como Google Authenticator ou Authy
              </p>
            </div>
            <Button variant="outline" onClick={handleRegenerate2FA} disabled={isRegenerating}>
              {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Regenerar QR Code
            </Button>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Códigos de Recuperação</p>
                <p className="text-sm text-muted-foreground">
                  {recoveryCodes.length} códigos restantes
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => downloadRecoveryCodes(recoveryCodes)}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" onClick={handleRegenerateRecoveryCodes}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Regenerar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-4 bg-muted rounded-lg">
              {recoveryCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-center py-1">
                  {code}
                </code>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <CardTitle>Sessões Ativas</CardTitle>
          </div>
          <CardDescription>Dispositivos conectados à sua conta</CardDescription>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleRevokeSession(session.id)}
                      >
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

      {/* Regenerate 2FA Dialog */}
      <Dialog open={regenerate2FADialog} onOpenChange={setRegenerate2FADialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo QR Code 2FA</DialogTitle>
            <DialogDescription>
              Escaneie este código com seu aplicativo autenticador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Seu QR code anterior será invalidado. Certifique-se de atualizar seu autenticador.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={newTotpUri} size={180} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código manual:</Label>
              <div className="flex gap-2">
                <Input readOnly value={newTotpSecret} className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRegenerate2FADialog(false)}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Recovery Codes Dialog */}
      <Dialog open={regenerateCodesDialog} onOpenChange={setRegenerateCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novos Códigos de Recuperação</DialogTitle>
            <DialogDescription>
              Seus códigos antigos foram invalidados. Salve estes novos códigos em um lugar seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Guarde estes códigos em um lugar seguro. Eles não serão mostrados novamente.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {newRecoveryCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-center py-1">
                  {code}
                </code>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => downloadRecoveryCodes(newRecoveryCodes)}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Códigos
            </Button>
            <Button onClick={() => {
              setRecoveryCodes(newRecoveryCodes);
              setRegenerateCodesDialog(false);
            }}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
