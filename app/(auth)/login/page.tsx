'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const totpSchema = z.object({
  code: z.string().min(6, 'Código deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TOTPFormData = z.infer<typeof totpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const totpForm = useForm<TOTPFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { code: '' },
  });

  async function onLoginSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.data.requiresSetup) {
        setAuthToken(result.data.token);
        router.push('/setup-2fa');
      } else if (result.data.requiresTotp) {
        setAuthToken(result.data.token);
        setStep('totp');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function onTOTPSubmit(data: TOTPFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, token: authToken }),
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
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-border/50 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-semibold">Admin Panel</CardTitle>
        <CardDescription className="text-muted-foreground">
          {step === 'credentials'
            ? 'Insira suas credenciais abaixo'
            : 'Digite o código do seu aplicativo autenticador'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'credentials' ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                autoFocus
                {...loginForm.register('email')}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...loginForm.register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

          </form>
        ) : (
          <form onSubmit={totpForm.handleSubmit(onTOTPSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificação</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                maxLength={12}
                className="text-center text-xl tracking-widest font-mono"
                {...totpForm.register('code')}
              />
              {totpForm.formState.errors.code && (
                <p className="text-sm text-destructive">{totpForm.formState.errors.code.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('credentials');
                setError(null);
              }}
            >
              Voltar ao login
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
