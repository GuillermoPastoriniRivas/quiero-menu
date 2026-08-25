'use client';

import Link from 'next/link';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { Logo } from '@/components/ui/logo';

/**
 * Logo del panel: si el local tiene cargados su nombre y su logo, muestra los
 * de la tienda; si no, cae al logo de quiero.menu.
 */
export function PanelLogo({
  size = 'lg',
  href = '/dashboard',
}: {
  size?: 'sm' | 'lg';
  href?: string;
}) {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const hasBranding = Boolean(restaurant?.name && restaurant?.logoUrl);

  const content = hasBranding && restaurant ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo remoto del usuario */}
      <img
        src={restaurant.logoUrl}
        alt=""
        width={size === 'lg' ? 48 : 24}
        height={size === 'lg' ? 48 : 24}
        className={`shrink-0 rounded-lg object-cover ${
          size === 'lg' ? 'h-12 w-12' : 'h-6 w-6'
        }`}
      />
      <span
        className={`truncate font-extrabold tracking-tight text-on-background ${
          size === 'lg' ? 'text-2xl' : 'text-lg'
        }`}
        style={{ fontFamily: 'var(--font-logo)' }}
      >
        {restaurant.name}
      </span>
    </>
  ) : (
    <Logo size={size} />
  );

  return (
    <Link href={href} className="flex items-center gap-2 min-w-0">
      {content}
    </Link>
  );
}