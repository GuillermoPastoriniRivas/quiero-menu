'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: 'bar_chart' },
  { href: '/orders', label: 'Pedidos', icon: 'receipt_long' },
  { href: '/menu', label: 'Menú', icon: 'restaurant_menu' },
  { href: '/analytics', label: 'Análisis', icon: 'insights' },
  { href: '/customers', label: 'Clientes', icon: 'group' },
  { href: '/coupons', label: 'Cupones', icon: 'confirmation_number' },
  { href: '/publicar', label: 'Publicar', icon: 'share' },
  { href: '/apariencia', label: 'Apariencia', icon: 'palette' },
  { href: '/billing', label: 'Plan y facturación', icon: 'workspace_premium' },
  { href: '/settings', label: 'Configuración', icon: 'settings' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = NAV_ITEMS.slice(0, 4);
  const rest = NAV_ITEMS.slice(4);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-outline-variant/40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {primary.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 px-2 flex-1 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                )}
              >
                <MaterialIcon name={item.icon} size="md" fill={isActive} />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
          {rest.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 px-2 flex-1 text-[10px] font-semibold',
                rest.some((i) => pathname.startsWith(i.href)) ? 'text-primary' : 'text-on-surface-variant'
              )}
            >
              <MaterialIcon name="apps" size="md" />
              <span>Más</span>
            </button>
          )}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle>Todas las secciones</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pt-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl p-4 text-xs font-semibold transition-colors',
                    isActive ? 'bg-surface-container text-primary' : 'bg-surface-container-low text-on-surface'
                  )}
                >
                  <MaterialIcon name={item.icon} size="lg" fill={isActive} />
                  <span className="text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
