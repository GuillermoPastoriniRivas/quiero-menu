'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Analytics', icon: 'bar_chart' },
  { href: '/orders', label: 'Pedidos', icon: 'receipt_long' },
  { href: '/menu', label: 'Menu', icon: 'restaurant_menu' },
  { href: '/mi-menu', label: 'Publicar', icon: 'share' },
  { href: '/settings', label: 'Configuracion', icon: 'settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { restaurant } = useRestaurantStore();

  const displayName = restaurant?.name || user?.name || 'Mi Restaurante';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col h-screen w-72 bg-white sticky top-0 shadow-[4px_0_16px_rgba(0,0,0,0.03)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <span className="text-2xl font-extrabold text-on-background tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Quiero Menu
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-4 mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-x-0.5',
                isActive
                  ? 'bg-surface-container-low text-primary'
                  : 'text-on-surface hover:bg-surface-container-low'
              )}
            >
              <MaterialIcon name={item.icon} size="md" fill={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className="mt-auto p-4">
        <div className="bg-surface-container-low rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-cta flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors w-full"
          >
            <MaterialIcon name="logout" size="sm" />
            Cerrar sesion
          </button>
        </div>
      </div>
    </aside>
  );
}
