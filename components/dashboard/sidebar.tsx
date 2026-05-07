'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/components/providers/admin-data-provider';
import { useSidebar } from '@/components/ui/sidebar';
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
  UserCog,
  User,
  KeyRound,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const baseNavItems: NavItem[] = [
  { title: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Organizações', href: '/dashboard/organizations', icon: Building2 },
  { title: 'Membros', href: '/dashboard/members', icon: Users },
  { title: 'Conformidade', href: '/dashboard/compliance', icon: Shield },
  { title: 'Integrações', href: '/dashboard/integrations', icon: Plug },
  { title: 'Faturamento', href: '/dashboard/billing', icon: CreditCard },
  { title: 'Operações', href: '/dashboard/operations', icon: Activity },
  { title: 'Logs de Auditoria', href: '/dashboard/audit', icon: FileText },
  { title: 'Onboarding', href: '/dashboard/onboarding', icon: ClipboardList },
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      { title: 'Perfil', href: '/dashboard/settings/profile', icon: User },
      { title: 'Segurança', href: '/dashboard/settings/security', icon: KeyRound },
      { title: 'Administradores', href: '/dashboard/settings/admins', icon: UserCog },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, complianceCount } = useAdminData();
  const { open: collapsed } = useSidebar();

  // useSidebar().open = true means expanded; we invert for local "collapsed" semantics
  const isCollapsed = !collapsed;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const initials = admin?.fullName
    ? admin.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const navItems = baseNavItems.map((item) =>
    item.href === '/dashboard/compliance' && complianceCount != null && complianceCount > 0
      ? { ...item, badge: String(complianceCount) }
      : item
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            {!isCollapsed && (
              <span className="font-semibold text-foreground">Painel Administrativo</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.title}
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                            {item.badge}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.href}>{linkContent}</li>;
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 rounded-md px-2 py-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {admin?.fullName ?? '...'}
                </span>
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
