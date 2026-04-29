'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Loader2, AlertCircle, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const confirmSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

type ConfirmFormData = z.infer<typeof confirmSchema>;

interface SetupData {
  secret: string;
  uri: string;
  recoveryCodes: string[];
}

export default function Setup2FAPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'qr' | 'recovery' | 'confirm'>('qr');

  const form = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    async function fetchSetupData() {
      try {
        const res = await fetch('/api/auth/setup-2fa');
        const result = await res.json();

        if (!result.ok) {
          if (result.status === 401) {
            router.push('/login');
            return;
          }
          setError(result.error);
          return;
        }

        setSetupData(result.data);
      } catch {
        setError('Erro ao carregar dados de configuração');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSetupData();
  }, [router]);

  async function onSubmit(data: ConfirmFormData) {
    if (!setupData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/confirm-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupData.secret,
          code: data.code,
          recoveryCodes: setupData.recoveryCodes,
        }),
      });

      const result = await res.json();

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function copySecret() {
    if (setupData) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function downloadRecoveryCodes() {
    if (!setupData) return;
    const content = setupData.recoveryCodes.join('\n');
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

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-2xl">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-semibold">Configurar 2FA</CardTitle>
        <CardDescription className="text-muted-foreground">
          {step === 'qr' && 'Escaneie o QR code com seu aplicativo autenticador'}
          {step === 'recovery' && 'Salve seus códigos de recuperação'}
          {step === 'confirm' && 'Digite o código para confirmar'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'qr' && setupData && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={setupData.uri} size={200} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ou digite o código manualmente:</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={setupData.secret}
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => setStep('recovery')}>
              Continuar
            </Button>
          </div>
        )}

        {step === 'recovery' && setupData && (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Guarde estes códigos em um lugar seguro. Você pode usá-los se perder acesso ao seu autenticador.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {setupData.recoveryCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-center py-1">
                  {code}
                </code>
              ))}
            </div>

            <Button variant="outline" className="w-full" onClick={downloadRecoveryCodes}>
              <Download className="mr-2 h-4 w-4" />
              Baixar códigos
            </Button>

            <Button className="w-full" onClick={() => setStep('confirm')}>
              Já salvei os códigos
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificação</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                className="text-center text-xl tracking-widest font-mono"
                {...form.register('code')}
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar e Ativar'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep('recovery')}
            >
              Voltar
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
