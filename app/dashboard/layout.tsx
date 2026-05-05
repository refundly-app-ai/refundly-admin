'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { CommandPalette } from '@/components/dashboard/command-palette';
import { AdminDataProvider } from '@/components/providers/admin-data-provider';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          open ? 'ml-64' : 'ml-16'
        )}
      >
        <Topbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminDataProvider>
      <SidebarProvider>
        <DashboardShell>{children}</DashboardShell>
      </SidebarProvider>
    </AdminDataProvider>
  );
}
