'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Plug,
  CreditCard,
  Activity,
  FileText,
  Settings,
  Search,
  Plus,
  UserPlus,
  Flag,
  RefreshCw,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Digite um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Visão Geral
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/organizations'))}>
            <Building2 className="mr-2 h-4 w-4" />
            Organizações
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/members'))}>
            <Users className="mr-2 h-4 w-4" />
            Membros
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/compliance'))}>
            <Shield className="mr-2 h-4 w-4" />
            Conformidade
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/integrations'))}>
            <Plug className="mr-2 h-4 w-4" />
            Integrações
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/billing'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            Faturamento
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/operations'))}>
            <Activity className="mr-2 h-4 w-4" />
            Operações
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/audit'))}>
            <FileText className="mr-2 h-4 w-4" />
            Logs de Auditoria
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/organizations?action=create'))}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Organização
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/members?action=invite'))}>
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Membro
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
            <Flag className="mr-2 h-4 w-4" />
            Gerenciar Feature Flags
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.location.reload())}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar Dados
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pesquisar">
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            Buscar Organizações...
          </CommandItem>
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            Buscar Membros...
          </CommandItem>
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            Buscar Logs de Auditoria...
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
