'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function settingsTab(pathname: string) {
  if (pathname.startsWith('/dashboard/settings/admins')) return 'admins';
  if (pathname.startsWith('/dashboard/settings/security')) return 'security';
  return 'profile';
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = settingsTab(pathname);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Perfil, segurança e administradores do painel
          </p>
        </div>
        <Tabs value={activeTab}>
          <TabsList className="h-auto flex-wrap gap-1 sm:flex-nowrap">
            <TabsTrigger value="profile" asChild>
              <Link href="/dashboard/settings/profile" prefetch>
                Perfil
              </Link>
            </TabsTrigger>
            <TabsTrigger value="security" asChild>
              <Link href="/dashboard/settings/security" prefetch>
                Segurança
              </Link>
            </TabsTrigger>
            <TabsTrigger value="admins" asChild>
              <Link href="/dashboard/settings/admins" prefetch>
                Administradores
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  );
}
