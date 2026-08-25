'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useConsentStore } from '@/stores/consent.store';

const subscribeNever = () => () => {};

export function CookieConsent() {
  const pathname = usePathname();
  const status = useConsentStore((s) => s.status);
  const hydrate = useConsentStore((s) => s.hydrate);
  const setConsent = useConsentStore((s) => s.setConsent);
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const [embedded] = useState(
    () => typeof window !== 'undefined' && window.self !== window.top,
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isClient || embedded || status !== 'unknown' || pathname === '/') {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Consentimiento de cookies"
      className="fixed bottom-0 inset-x-0 z-[100] p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-surface border border-outline-variant/30 shadow-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <p className="text-sm text-on-surface flex-1">
          Usamos cookies de analisis (Google Analytics) para mejorar tu experiencia. Solo se activan si las
          aceptas. Podes ver mas detalle en nuestra{' '}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            politica de privacidad
          </Link>
          .
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" onClick={() => setConsent('denied')}>
            Rechazar
          </Button>
          <Button onClick={() => setConsent('granted')}>Aceptar</Button>
        </div>
      </div>
    </div>
  );
}