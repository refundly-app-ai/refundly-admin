'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Shield,
  Key,
  Download,
  RotateCcw,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminData {
  id: string;
  email: string;
  fullName: string;
  totpEnabled: boolean;
  lastLoginAt: string | null;
}

export default function SettingsProfilePage() {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  // Troca de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 2FA
  const [regenerate2FADialog, setRegenerate2FADialog] = useState(false);
  const [newTotpUri, setNewTotpUri] = useState('');
  const [newTotpSecret, setNewTotpSecret] = useState('');
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Códigos de recuperação
  const [regenerateCodesDialog, setRegenerateCodesDialog] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) setAdmin(result.data);
      })
      .finally(() => setIsLoadingAdmin(false));
  }, []);

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) return;
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();

      if (result.ok) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.error || 'Erro ao alterar senha');
      }
    } catch {
      setPasswordError('Erro de conexão');
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleRegenerate2FA() {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/auth/setup-2fa');
      const result = await res.json();
      if (result.ok) {
        setNewTotpUri(result.data.uri);
        setNewTotpSecret(result.data.secret);
        setNewRecoveryCodes(result.data.recoveryCodes ?? []);
        setRegenerate2FADialog(true);
      }
    } finally {
      setIsRegenerating(false);
    }
  }

  const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);
  const [recoveryCodesError, setRecoveryCodesError] = useState('');

  async function handleRegenerateRecoveryCodes() {
    setIsRegeneratingCodes(true);
    setRecoveryCodesError('');
    try {
      const res = await fetch('/api/auth/regenerate-recovery-codes', { method: 'POST' });
      const result = await res.json();
      if (result.ok) {
        setNewRecoveryCodes(result.data.codes);
        setRegenerateCodesDialog(true);
      } else {
        setRecoveryCodesError(result.error || 'Erro ao regenerar códigos');
      }
    } catch {
      setRecoveryCodesError('Erro de conexão');
    } finally {
      setIsRegeneratingCodes(false);
    }
  }

  function downloadRecoveryCodes(codes: string[]) {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
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

  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-semibold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas configurações de conta e segurança</p>
      </div>

      {/* Informações do Perfil */}
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
              <p className="font-medium">{admin?.fullName ?? '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">E-mail</Label>
              <p className="font-medium">{admin?.email ?? '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Último Login</Label>
              <p className="font-medium">
                {admin?.lastLoginAt
                  ? format(new Date(admin.lastLoginAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                  : 'Nunca'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">2FA</Label>
              <div className="flex items-center gap-2">
                {admin?.totpEnabled ? (
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

      {/* Alterar Senha */}
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
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-success">Senha alterada com sucesso!</p>}
          <Button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isChangingPassword}
          >
            {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      {/* 2FA */}
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
                Use Google Authenticator, Authy ou similar
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
                  {recoveryCodes.length > 0 ? `${recoveryCodes.length} códigos disponíveis` : 'Gerados no primeiro login'}
                </p>
              </div>
              <div className="flex gap-2">
                {recoveryCodes.length > 0 && (
                  <Button variant="outline" onClick={() => downloadRecoveryCodes(recoveryCodes)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                )}
                <Button variant="outline" onClick={handleRegenerateRecoveryCodes} disabled={isRegeneratingCodes}>
                  {isRegeneratingCodes ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Regenerar
                </Button>
              </div>
            </div>
            {recoveryCodesError && (
              <p className="text-sm text-destructive mt-2">{recoveryCodesError}</p>
            )}
            {recoveryCodes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-4 bg-muted rounded-lg">
                {recoveryCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono text-center py-1">{code}</code>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Regenerar QR Code 2FA */}
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
                Seu QR code anterior será invalidado. Atualize seu autenticador agora.
              </AlertDescription>
            </Alert>
            {newTotpUri && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG value={newTotpUri} size={180} />
                </div>
              </div>
            )}
            {newTotpSecret && (
              <div className="space-y-2">
                <Label>Código manual:</Label>
                <div className="flex gap-2">
                  <Input readOnly value={newTotpSecret} className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setRegenerate2FADialog(false)}>Concluído</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Regenerar Códigos de Recuperação */}
      <Dialog open={regenerateCodesDialog} onOpenChange={setRegenerateCodesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novos Códigos de Recuperação</DialogTitle>
            <DialogDescription>
              Seus códigos antigos foram invalidados. Salve estes em um lugar seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Estes códigos não serão mostrados novamente.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {newRecoveryCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-center py-1">{code}</code>
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
