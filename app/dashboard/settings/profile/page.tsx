'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Shield, Loader2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((result) => {
        if (result.ok) setAdmin(result.data);
      })
      .finally(() => setIsLoadingAdmin(false));
  }, []);

  function startEditingName() {
    setNameDraft(admin?.fullName ?? '');
    setNameError('');
    setNameSaved(false);
    setIsEditingName(true);
  }

  function cancelEditingName() {
    setIsEditingName(false);
    setNameDraft('');
    setNameError('');
  }

  async function handleSaveName() {
    if (!admin || !nameDraft.trim()) return;
    setIsSavingName(true);
    setNameError('');
    setNameSaved(false);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: nameDraft.trim() }),
      });
      const result = await res.json();
      if (result.ok) {
        setAdmin(result.data);
        setIsEditingName(false);
        setNameDraft('');
        setNameSaved(true);
        window.setTimeout(() => setNameSaved(false), 3000);
      } else {
        setNameError(result.error || 'Erro ao salvar');
      }
    } catch {
      setNameError('Erro de conexão');
    } finally {
      setIsSavingName(false);
    }
  }

  if (isLoadingAdmin) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Dados da sua conta. Senha e 2FA ficam na aba Segurança.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Informações do Perfil</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="profile-fullName">Nome</Label>
              {!isEditingName ? (
                <Button type="button" variant="outline" size="sm" onClick={startEditingName}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Editar
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEditingName}
                    disabled={isSavingName}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveName}
                    disabled={
                      isSavingName ||
                      !nameDraft.trim() ||
                      nameDraft.trim() === (admin?.fullName ?? '').trim()
                    }
                  >
                    {isSavingName ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Salvar
                  </Button>
                </div>
              )}
            </div>
            {isEditingName ? (
              <Input
                id="profile-fullName"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Seu nome completo"
                autoComplete="name"
              />
            ) : (
              <p className="font-medium">{admin?.fullName ?? '—'}</p>
            )}
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            {!isEditingName && nameSaved && (
              <p className="text-sm text-success">Nome atualizado.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">E-mail</Label>
              <p className="font-medium">{admin?.email ?? '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Último Login</Label>
              <p className="font-medium">
                {admin?.lastLoginAt
                  ? format(
                      new Date(admin.lastLoginAt),
                      "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                      { locale: ptBR },
                    )
                  : 'Nunca'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">2FA</Label>
              <div className="flex items-center gap-2 pt-1">
                {admin?.totpEnabled ? (
                  <Badge className="bg-success/10 text-success">
                    <Shield className="mr-1 h-3 w-3" />
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
    </div>
  );
}
