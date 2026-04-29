'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
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
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Overview
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/organizations'))}>
            <Building2 className="mr-2 h-4 w-4" />
            Organizations
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/members'))}>
            <Users className="mr-2 h-4 w-4" />
            Members
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/compliance'))}>
            <Shield className="mr-2 h-4 w-4" />
            Compliance
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/integrations'))}>
            <Plug className="mr-2 h-4 w-4" />
            Integrations
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/billing'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/operations'))}>
            <Activity className="mr-2 h-4 w-4" />
            Operations
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/audit'))}>
            <FileText className="mr-2 h-4 w-4" />
            Audit Logs
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/organizations?action=create'))}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/members?action=invite'))}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings/feature-flags'))}>
            <Flag className="mr-2 h-4 w-4" />
            Manage Feature Flags
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.location.reload())}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Search">
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            Search Organizations...
          </CommandItem>
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            Search Members...
          </CommandItem>
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            Search Audit Logs...
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
