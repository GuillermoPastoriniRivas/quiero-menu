'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { AdminRestaurantListItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatDate } from '@/lib/format';

export default function AdminLocalesPage() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<AdminRestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ results: AdminRestaurantListItem[] }>(
        `/admin/restaurants?q=${encodeURIComponent(q)}`,
      );
      setResults(data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search('');
  }, [search]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Locales</h1>
          <p className="text-sm text-on-surface-variant">
            Buscá por nombre, slug o email del dueño
          </p>
        </div>
        <Link href="/admin/locales/nuevo">
          <Button size="sm">
            <MaterialIcon name="add" size="sm" />
            Nuevo local
          </Button>
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(term);
        }}
        className="flex gap-2 mb-6"
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="la-famosa, juan@local.com..."
        />
        <Button type="submit" variant="outline" disabled={loading}>
          <MaterialIcon name="search" size="sm" />
          Buscar
        </Button>
      </form>

      {error && (
        <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <MaterialIcon name="storefront" size="xl" className="mb-2" />
          <p>No hay locales que coincidan</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/admin/locales/${r.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-outline-variant/40 px-5 py-4 hover:border-primary/50 transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MaterialIcon name="storefront" size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-bold text-on-surface truncate">{r.name}</span>
                  <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
                    {r.plan ?? '?'}
                  </span>
                  {r.status !== 'active' && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-error bg-error-container rounded-full px-2 py-0.5">
                      {r.status}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-on-surface-variant truncate mt-0.5">
                  quiero.menu/{r.slug}
                  {r.city ? ` · ${r.city}` : ''} · {r.ownerName || 'sin dueño'}{' '}
                  {r.ownerEmail && `(${r.ownerEmail})`}
                </span>
              </span>
              <span className="hidden sm:block text-xs text-on-surface-variant shrink-0">
                {formatDate(r.createdAt)}
              </span>
              <MaterialIcon
                name="chevron_right"
                size="sm"
                className="text-outline shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
