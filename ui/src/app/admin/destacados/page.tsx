'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatDate } from '@/lib/format';

interface FeaturedSlotItem {
  id: string;
  scope: 'category' | 'home';
  citySlug: string;
  category: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  restaurant: { id: string; slug: string; name: string } | null;
}

export default function AdminDestacadosPage() {
  const [slots, setSlots] = useState<FeaturedSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ slots: FeaturedSlotItem[] }>(
        '/admin/featured',
      );
      setSlots(data.slots);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deactivate = async (id: string) => {
    if (!window.confirm('¿Dar de baja este destacado?')) return;
    setWorking(id);
    setError('');
    try {
      await api.post(`/admin/featured/${id}/deactivate`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo dar de baja');
    } finally {
      setWorking('');
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
        Destacados
      </h1>
      <p className="mb-6 text-sm text-on-surface-variant">
        Lugares arriba del buscador: hasta 3 por rubro y ciudad, y 3 en la portada de cada ciudad. Se asignan desde la
        página de cada local.
      </p>

      {error && (
        <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <MaterialIcon name="star" size="xl" className="mb-2" />
          <p>No hay destacados vigentes</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {slots.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-2xl border border-amber-400/40 bg-surface-container-lowest px-5 py-4 shadow-sm"
            >
              <span className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-700 flex items-center justify-center shrink-0">
                <MaterialIcon name="star" size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-bold text-on-surface truncate block">
                  {s.restaurant ? (
                    <Link
                      href={`/admin/locales/${s.restaurant.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {s.restaurant.name}
                    </Link>
                  ) : (
                    'Local eliminado'
                  )}
                </span>
                <span className="block text-xs text-on-surface-variant truncate mt-0.5">
                  {s.scope === 'home' ? 'Portada de la ciudad' : `Rubro ${s.category}`} ·{' '}
                  {s.citySlug} · hasta el {formatDate(s.endsAt)}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={working === s.id}
                onClick={() => deactivate(s.id)}
              >
                {working === s.id ? '...' : 'Dar de baja'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
