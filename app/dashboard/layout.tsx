'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { CommandPalette } from '@/components/dashboard/command-palette';
import { AdminDataProvider } from '@/components/providers/admin-data-provider';

type SidebarContextProps = {
  open: boolean;
  toggleSidebar: () => void;
};

export const SidebarContext = createContext<SidebarContextProps>({
  open: true,
  toggleSidebar: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const toggleSidebar = useCallback(() => setOpen((v) => !v), []);

  return (
    <SidebarContext.Provider value={{ open, toggleSidebar }}>
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
    </SidebarContext.Provider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminDataProvider>
      <DashboardShell>{children}</DashboardShell>
    </AdminDataProvider>
  );
}
