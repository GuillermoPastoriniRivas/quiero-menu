'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { cn } from '@/lib/utils';

export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 lg:hidden',
        show ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <Link
        href="/signup"
        className="gradient-cta flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white"
      >
        Crear mi menú gratis
        <MaterialIcon name="arrow_forward" size="sm" />
      </Link>
      <p className="mt-2 text-center text-[11px] text-on-surface-variant">
        Sin tarjeta · Listo en 5 minutos · Cancelás cuando quieras
      </p>
    </div>
  );
}
