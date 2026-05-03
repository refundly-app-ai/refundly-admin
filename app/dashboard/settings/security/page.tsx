'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
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

export default function SettingsSecurityPage() {
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [regenerate2FADialog, setRegenerate2FADialog] = useState(false);
  const [newTotpUri, setNewTotpUri] = useState('');
  const [newTotpSecret, setNewTotpSecret] = useState('');
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [regenerateCodesDialog, setRegenerateCodesDialog] = useState(false);
  const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);
  const [recoveryCodesError, setRecoveryCodesError] = useState('');

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

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Segurança</h2>
        <p className="text-muted-foreground">
          Senha, autenticador TOTP e códigos de recuperação
        </p>
      </div>

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
            disabled={
              !currentPassword ||
              !newPassword ||
              newPassword !== confirmPassword ||
              isChangingPassword
            }
          >
            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Autenticação em Duas Etapas</CardTitle>
          </div>
          <CardDescription>Gerencie seu autenticador TOTP e códigos de recuperação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Autenticador TOTP</p>
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator, Authy ou similar
              </p>
            </div>
            <Button variant="outline" onClick={handleRegenerate2FA} disabled={isRegenerating}>
              {isRegenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Regenerar QR Code
            </Button>
          </div>

          <Separator />

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Códigos de Recuperação</p>
                <p className="text-sm text-muted-foreground">
                  {recoveryCodes.length > 0
                    ? `${recoveryCodes.length} códigos disponíveis`
                    : 'Gerados no primeiro login'}
                </p>
              </div>
              <div className="flex gap-2">
                {recoveryCodes.length > 0 && (
                  <Button variant="outline" onClick={() => downloadRecoveryCodes(recoveryCodes)}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleRegenerateRecoveryCodes}
                  disabled={isRegeneratingCodes}
                >
                  {isRegeneratingCodes ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  Regenerar
                </Button>
              </div>
            </div>
            {recoveryCodesError && (
              <p className="mt-2 text-sm text-destructive">{recoveryCodesError}</p>
            )}
            {recoveryCodes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 md:grid-cols-5">
                {recoveryCodes.map((code, i) => (
                  <code key={i} className="py-1 text-center font-mono text-sm">
                    {code}
                  </code>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                <div className="rounded-lg bg-white p-4">
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
              <AlertDescription>Estes códigos não serão mostrados novamente.</AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4">
              {newRecoveryCodes.map((code, i) => (
                <code key={i} className="py-1 text-center font-mono text-sm">
                  {code}
                </code>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => downloadRecoveryCodes(newRecoveryCodes)}>
              <Download className="mr-2 h-4 w-4" />
              Baixar Códigos
            </Button>
            <Button
              onClick={() => {
                setRecoveryCodes(newRecoveryCodes);
                setRegenerateCodesDialog(false);
              }}
            >
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
