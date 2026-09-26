'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGate } from '@/components/admin/admin-gate';
import { useAuthStore } from '@/stores/auth.store';
import { useAdminStore } from '@/stores/admin.store';
import { Logo } from '@/components/ui/logo';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  badge?: 'claims';
}

const PRIMARY: NavItem[] = [
  { href: '/admin', label: 'Resumen', icon: 'insights', exact: true },
  { href: '/admin/locales', label: 'Locales', icon: 'storefront' },
  { href: '/admin/reclamos', label: 'Reclamos', icon: 'mark_email_unread', badge: 'claims' },
];

const SECONDARY: NavItem[] = [
  { href: '/admin/destacados', label: 'Destacados', icon: 'star' },
  { href: '/admin/activity', label: 'Actividad', icon: 'history' },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href || pathname === `${item.href}/`;
  if (item.href === '/admin/locales' && pathname.startsWith('/admin/locales/nuevo')) return false;
  return pathname.startsWith(item.href);
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-extrabold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SidebarLink({ item, pathname, pending }: { item: NavItem; pathname: string; pending: number }) {
  const active = isActive(pathname, item);
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-low',
      )}
    >
      <MaterialIcon name={item.icon} size="md" fill={active} />
      <span>{item.label}</span>
      {item.badge === 'claims' && <Badge count={pending} />}
    </Link>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pending = useAdminStore((s) => s.pendingClaims);
  const refreshPendingClaims = useAdminStore((s) => s.refreshPendingClaims);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    refreshPendingClaims();
  }, [refreshPendingClaims, pathname]);

  const ownPanel = Boolean(user?.restaurantId) && !user?.operating;

  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-outline-variant/20 bg-surface-container-lowest lg:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <Logo size="sm" href="/admin" />
          <span className="rounded-full bg-on-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-surface">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {PRIMARY.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} pending={pending} />
          ))}
          <Link
            href="/admin/locales/nuevo"
            className="my-3 flex items-center justify-center gap-2 rounded-xl gradient-cta px-3 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20"
          >
            <MaterialIcon name="add" size="sm" />
            Nuevo local
          </Link>
          <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Más
          </p>
          {SECONDARY.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} pending={pending} />
          ))}
        </nav>
        <div className="space-y-1 border-t border-outline-variant/20 p-3">
          <p className="truncate px-3 pb-1 text-xs text-on-surface-variant">{user?.email}</p>
          {ownPanel && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            >
              <MaterialIcon name="restaurant" size="sm" />
              Mi panel de local
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-error"
          >
            <MaterialIcon name="logout" size="sm" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-outline-variant/20 bg-surface-container-lowest/95 px-4 backdrop-blur lg:hidden">
          <Logo size="sm" href="/admin" />
          <span className="rounded-full bg-on-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-surface">
            Admin
          </span>
          <Link
            href="/admin/locales/nuevo"
            className="ml-auto flex h-9 items-center gap-1 rounded-xl gradient-cta px-3 text-xs font-bold text-white"
          >
            <MaterialIcon name="add" size="sm" />
            Nuevo
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/30 bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-stretch justify-around">
          {PRIMARY.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-semibold',
                  active ? 'text-primary' : 'text-on-surface-variant',
                )}
              >
                <MaterialIcon name={item.icon} size="md" fill={active} />
                {item.label}
                {item.badge === 'claims' && pending > 0 && (
                  <span className="absolute right-[28%] top-1.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-semibold',
              SECONDARY.some((i) => isActive(pathname, i)) ? 'text-primary' : 'text-on-surface-variant',
            )}
          >
            <MaterialIcon name="apps" size="md" />
            Más
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle>Admin</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 px-4">
            {SECONDARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <MaterialIcon name={item.icon} size="sm" className="text-on-surface-variant" />
                {item.label}
              </Link>
            ))}
            {ownPanel && (
              <Link
                href="/dashboard"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <MaterialIcon name="restaurant" size="sm" className="text-on-surface-variant" />
                Mi panel de local
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-error hover:bg-error-container/40"
            >
              <MaterialIcon name="logout" size="sm" />
              Cerrar sesión
            </button>
            <p className="px-4 pt-2 text-xs text-on-surface-variant">{user?.email}</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}
