'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

interface Check {
  name: string;
  url: string;
  status: 'ok' | 'error' | 'checking';
}

const CHECKS: Check[] = [
  { name: 'API (liveness)', url: '/api/v1/health', status: 'checking' },
  {
    name: 'API (readiness + base de datos)',
    url: '/api/v1/health/ready',
    status: 'checking',
  },
  { name: 'Sitio', url: '/', status: 'checking' },
];

export default function StatusPage() {
  const [checks, setChecks] = useState<Check[]>(CHECKS);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const checkAll = useCallback(async () => {
    const results = await Promise.all(
      CHECKS.map(async (check) => {
        try {
          const base =
            check.url === '/'
              ? ''
              : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
          const res = await fetch(`${base}${check.url}`, {
            cache: 'no-store',
          });
          return {
            ...check,
            status: (res.ok ? 'ok' : 'error') as Check['status'],
          };
        } catch {
          return { ...check, status: 'error' as Check['status'] };
        }
      }),
    );
    setChecks(results);
    setLastRun(new Date());
  }, []);

  const run = useCallback(() => {
    setChecks((prev) => prev.map((c) => ({ ...c, status: 'checking' })));
    void checkAll();
  }, [checkAll]);

  useEffect(() => {
    const initial = setTimeout(() => void checkAll(), 0);
    const interval = setInterval(run, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [checkAll, run]);

  const allOk = checks.every((c) => c.status === 'ok');

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 bg-surface">
        <Logo size="md" href="/" />
        <Link href="/" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
          Volver al inicio
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-ambient-lg p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`inline-block w-3 h-3 rounded-full ${allOk ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <h1 className="text-2xl font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
              Estado del servicio
            </h1>
          </div>

          <ul className="space-y-3 mb-6">
            {checks.map((check) => (
              <li
                key={check.name}
                className="flex items-center justify-between gap-4 bg-surface-container-low px-4 py-3 rounded-2xl"
              >
                <span className="text-sm font-medium text-on-surface">{check.name}</span>
                <span
                  className={`text-xs font-bold uppercase ${
                    check.status === 'ok'
                      ? 'text-green-600'
                      : check.status === 'error'
                        ? 'text-red-600'
                        : 'text-on-surface-variant'
                  }`}
                >
                  {check.status === 'ok'
                    ? 'Operativo'
                    : check.status === 'error'
                      ? 'Con fallas'
                      : 'Verificando...'}
                </span>
              </li>
            ))}
          </ul>

          {lastRun && (
            <p className="text-xs text-on-surface-variant mb-4">
              Ultima verificacion: {lastRun.toLocaleTimeString('es-AR')}
            </p>
          )}

          <button
            onClick={run}
            className="w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary/90 transition-colors"
          >
            Volver a verificar
          </button>
        </div>
      </main>
    </div>
  );
}