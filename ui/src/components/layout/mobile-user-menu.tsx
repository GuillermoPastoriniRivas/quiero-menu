'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function MobileUserMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { restaurant } = useRestaurantStore();

  const displayName = restaurant?.name || user?.name || 'Mi Restaurante';
  const initials = displayName.slice(0, 2).toUpperCase();
  const slug = restaurant?.slug || user?.restaurantSlug;

  const itemClass =
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden"
        aria-label="Abrir menú de usuario"
        aria-haspopup="dialog"
      >
        {restaurant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.logoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <MaterialIcon name="person" size="sm" className="text-on-surface-variant" />
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="flex-row items-center gap-3 pt-6">
            <div className="w-12 h-12 rounded-full gradient-cta flex items-center justify-center text-white font-bold text-base shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{user?.name || displayName}</SheetTitle>
              {user?.email && <SheetDescription className="truncate">{user.email}</SheetDescription>}
              {restaurant?.name && restaurant.name !== user?.name && (
                <p className="text-xs text-on-surface-variant truncate">{restaurant.name}</p>
              )}
            </div>
          </SheetHeader>

          <div className="px-4">
            <Separator />
          </div>

          <nav className="flex flex-col gap-1 px-4" aria-label="Menú de usuario">
            {slug && (
              <Link href={`/${slug}`} onClick={() => setOpen(false)} className={itemClass}>
                <MaterialIcon name="storefront" size="sm" className="text-on-surface-variant" />
                Mi menú público
              </Link>
            )}
            <Link href="/account" onClick={() => setOpen(false)} className={itemClass}>
              <MaterialIcon name="notifications" size="sm" className="text-on-surface-variant" />
              Notificaciones
            </Link>
            <Link href="/account?tab=access" onClick={() => setOpen(false)} className={itemClass}>
              <MaterialIcon name="key" size="sm" className="text-on-surface-variant" />
              Accesos
            </Link>
            <Link href="/billing" onClick={() => setOpen(false)} className={itemClass}>
              <MaterialIcon name="workspace_premium" size="sm" className="text-on-surface-variant" />
              Plan y facturación
            </Link>
            <button
              type="button"
              onClick={logout}
              className={cn(itemClass, 'text-destructive hover:bg-destructive/10')}
            >
              <MaterialIcon name="logout" size="sm" />
              Cerrar sesión
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
