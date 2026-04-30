'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const unlockSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

type UnlockFormData = z.infer<typeof unlockSchema>;

interface AdminInfo {
  fullName: string;
  email: string;
}

export default function LockedPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) {
          setAdmin({ fullName: result.data.fullName, email: result.data.email });
        }
      })
      .catch(() => {});
  }, []);

  const form = useForm<UnlockFormData>({
    resolver: zodResolver(unlockSchema),
    defaultValues: { password: '' },
  });

  async function onSubmit(data: UnlockFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.password }),
      });

      const result = await res.json();

      if (result.ok) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Senha incorreta');
      }
    } catch {
      setError('Erro ao verificar senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const initials = admin
    ? admin.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <Card className="border-border/50 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-semibold">Tela Bloqueada</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sua sessão foi bloqueada por inatividade
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-6">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{admin?.fullName ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{admin?.email ?? '—'}</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desbloqueando...
              </>
            ) : (
              'Desbloquear'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair e fazer login com outra conta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
