'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ActivityFeed } from '@/components/admin/activity-feed';
import type { AdminActivityEntry } from '@/types';

export default function AdminActivityPage() {
  const [entries, setEntries] = useState<AdminActivityEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ entries: AdminActivityEntry[] }>('/admin/activity?limit=100')
      .then((data) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar la actividad');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
          Actividad
        </h1>
        <p className="text-sm text-on-surface-variant">
          Lo que pasó en la plataforma: altas, invitaciones, ediciones y pagos. Las ediciones seguidas se agrupan.
        </p>
      </div>
      {error && <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</div>}
      <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
        {entries === null && !error ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-surface-container-high/60" />
            ))}
          </div>
        ) : (
          <ActivityFeed entries={entries ?? []} showRestaurant />
        )}
      </section>
    </div>
  );
}
