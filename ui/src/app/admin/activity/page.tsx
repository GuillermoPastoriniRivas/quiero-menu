'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AdminAuditLogEntry } from '@/types';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatDate } from '@/lib/format';

const EVENT_ICONS: Record<string, string> = {
  'auth.login': 'login',
  'auth.signup': 'person_add',
  'auth.logout': 'logout',
  'auth.email_verified': 'mark_email_read',
  'auth.password_reset': 'lock_reset',
  'billing.checkout': 'shopping_cart',
  'billing.cancel': 'money_off',
  'custom-domain.set': 'language',
  'custom-domain.remove': 'language',
  'account.deleted': 'person_remove',
  'admin.restaurant_created': 'add_business',
  'admin.impersonated': 'swap_horiz',
};

export default function AdminActivityPage() {
  const [entries, setEntries] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ entries: AdminAuditLogEntry[] }>(
        '/admin/audit-logs?limit=100',
      );
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar actividad');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-on-surface mb-1">Actividad</h1>
      <p className="text-sm text-on-surface-variant mb-6">
        Últimos eventos sensibles de la plataforma
      </p>

      {error && (
        <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <MaterialIcon name="history" size="xl" className="mb-2" />
          <p>Sin eventos todavía</p>
        </div>
      ) : (
        <div className="grid gap-1.5">
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 bg-white rounded-xl border border-outline-variant/30 px-4 py-3"
            >
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MaterialIcon name={EVENT_ICONS[e.event] ?? 'bolt'} size="sm" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface font-mono">
                  {e.event}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  actor {e.actorUserId ?? '—'} · local {e.restaurantId ?? '—'}
                  {e.metadata ? ` · ${JSON.stringify(e.metadata)}` : ''}
                </p>
              </div>
              <span className="text-xs text-on-surface-variant shrink-0">
                {formatDate(e.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
