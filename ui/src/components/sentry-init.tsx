'use client';

import { useEffect } from 'react';

export function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    // El SDK de Sentry pesa ~240KB sin tree-shake: lo cargamos con import
    // dinamico para que no entre en el bundle inicial de la homepage.
    void import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
      });
    });
  }, []);

  return null;
}