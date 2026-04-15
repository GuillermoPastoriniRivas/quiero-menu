'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/orders', label: 'Pedidos', icon: 'confirmation_number' },
  { href: '/menu', label: 'Menú', icon: 'restaurant_menu' },
  { href: '/publicar', label: 'Publicar', icon: 'share' },
  { href: '/settings', label: 'Cuenta', icon: 'person' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white/90 backdrop-blur-xl rounded-t-2xl shadow-[0px_-4px_16px_rgba(0,0,0,0.04)] border-t border-outline-variant/10">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center active:scale-90 transition-transform',
              isActive
                ? 'text-primary bg-primary/5 rounded-xl px-4 py-1'
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            <MaterialIcon name={item.icon} size="lg" fill={isActive} />
            <span className="text-[11px] font-bold uppercase tracking-wider mt-0.5">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
