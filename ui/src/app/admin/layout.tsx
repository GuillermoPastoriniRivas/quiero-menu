'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGate } from '@/components/admin/admin-gate';
import { useAuthStore } from '@/stores/auth.store';
import { PanelLogo } from '@/components/layout/panel-logo';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/locales', label: 'Locales', icon: 'storefront' },
  { href: '/admin/activity', label: 'Actividad', icon: 'history' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="min-h-screen bg-surface-container-low">
        <header className="bg-white border-b border-outline-variant/30 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-6">
            <PanelLogo size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
              Interno
            </span>
            <nav className="flex items-center gap-1 ml-2">
              {NAV_ITEMS.map((item) => (
                <AdminNavItem key={item.href} {...item} />
              ))}
            </nav>
            <div className="ml-auto">
              <AdminUserMenu />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
      </div>
    </AdminGate>
  );
}

function AdminNavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low',
      )}
    >
      <MaterialIcon name={icon} size="sm" />
      {label}
    </Link>
  );
}

function AdminUserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:block text-xs text-on-surface-variant truncate max-w-48">
        {user?.email}
      </span>
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-error transition-colors"
      >
        <MaterialIcon name="logout" size="sm" />
        Salir
      </button>
    </div>
  );
}
