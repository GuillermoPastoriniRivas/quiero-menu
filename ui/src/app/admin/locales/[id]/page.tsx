'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { browserPathParam } from '@/lib/static-route-param';
import { backupSessionForImpersonation } from '@/lib/admin-session';
import type { AdminRestaurantDetail, ImpersonateResponse } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatDate } from '@/lib/format';

const NOT_FOUND_FALLBACK = 'unknown';

export default function AdminLocalDetailPage() {
  const id = browserPathParam('', NOT_FOUND_FALLBACK);
  const router = useRouter();
  const [detail, setDetail] = useState<AdminRestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [featScope, setFeatScope] = useState<'category' | 'home'>('category');
  const [featDays, setFeatDays] = useState('30');
  const [featuring, setFeaturing] = useState(false);
  const [featMsg, setFeatMsg] = useState('');

  const load = useCallback(async () => {
    if (!id || id === NOT_FOUND_FALLBACK) {
      setError('ID de local inválido');
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<AdminRestaurantDetail>(
        `/admin/restaurants/${id}`,
      );
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el local');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImpersonate = async () => {
    if (!detail) return;
    setImpersonating(true);
    try {
      const session = await api.post<ImpersonateResponse>(
        `/admin/restaurants/${detail.restaurant.id}/impersonate`,
        {},
      );
      backupSessionForImpersonation();
      api.setTokens(session.accessToken, session.refreshToken);
      useAuthStore.getState().setUser(session.user);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo entrar al local');
      setImpersonating(false);
    }
  };

  const handleFeature = async () => {
    if (!detail) return;
    setFeaturing(true);
    setFeatMsg('');
    try {
      const out = await api.post<{ slotId: string; endsAt: string }>(
        '/admin/featured',
        {
          restaurantId: detail.restaurant.id,
          scope: featScope,
          days: Number(featDays) || 30,
        },
      );
      setFeatMsg(`Destacado hasta el ${formatDate(out.endsAt)}`);
    } catch (e) {
      setFeatMsg(e instanceof Error ? e.message : 'No se pudo destacar');
    } finally {
      setFeaturing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    );
  }

  if (!detail) return null;

  const r = detail.restaurant;
  const s = detail.subscription;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/locales"
        className="flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors mb-4"
      >
        <MaterialIcon name="arrow_back" size="sm" />
        Locales
      </Link>

      <div className="bg-white rounded-2xl border border-outline-variant/40 p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface truncate">{r.name}</h1>
              <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
                {s?.plan ?? '?'}
              </span>
            </div>
            <a
              href={`/${r.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              quiero.menu/{r.slug} ↗
            </a>
            <p className="text-xs text-on-surface-variant mt-2">
              {r.city ? `${r.city}, ` : ''}
              {r.country || '—'} · alta {formatDate(r.createdAt)}
            </p>
          </div>
          <Button onClick={handleImpersonate} disabled={impersonating}>
            <MaterialIcon name="login" size="sm" />
            {impersonating ? 'Entrando...' : 'Entrar como dueño'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 bg-error-container/30 text-on-error-container px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <InfoCard title="Dueño">
          <p className="font-semibold text-on-surface">{detail.owner?.name || '—'}</p>
          <p className="text-sm text-on-surface-variant">{detail.owner?.email}</p>
          <p className="text-xs mt-1">
            {detail.owner?.emailVerified ? (
              <span className="text-success font-bold">Email verificado</span>
            ) : (
              <span className="text-on-surface-variant">Email sin verificar</span>
            )}
          </p>
        </InfoCard>

        <InfoCard title="Suscripción">
          <p className="font-semibold text-on-surface capitalize">{s?.plan ?? '—'}</p>
          <p className="text-sm text-on-surface-variant capitalize">{s?.status ?? 'sin datos'}</p>
          {s?.canceledAt && (
            <p className="text-xs text-error mt-1">
              Cancelada el {formatDate(s.canceledAt)}
            </p>
          )}
        </InfoCard>

        <InfoCard title="Pedidos">
          <p className="text-2xl font-extrabold text-on-surface">{detail.stats.ordersTotal}</p>
          <p className="text-xs text-on-surface-variant">
            {detail.stats.ordersLast30d} en los últimos 30 días
          </p>
        </InfoCard>

        <InfoCard title="Menú">
          <p className="text-sm text-on-surface">
            {detail.stats.categories} categorías · {detail.stats.products} productos
          </p>
          {detail.stats.categories === 0 && (
            <p className="text-xs text-on-surface-variant mt-1">
              Sin menú cargado todavía
            </p>
          )}
        </InfoCard>
      </div>

      <InfoCard title="Contacto y dominio">
        <dl className="text-sm space-y-1">
          <Row label="Teléfono" value={r.phone || '—'} />
          <Row label="Dirección" value={r.address || '—'} />
          <Row label="Moneda" value={r.currency} />
          <Row label="Timezone" value={r.timezone} />
          <Row label="Dominio custom" value={r.customDomain ?? '—'} />
          <Row label="Estado" value={r.status} />
        </dl>
      </InfoCard>

      <div className="bg-white rounded-2xl border border-amber-400/40 p-5 mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Destacar en el directorio
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-on-surface-variant">
              Lugar
            </Label>
            <select
              value={featScope}
              onChange={(e) =>
                setFeatScope(e.target.value as 'category' | 'home')
              }
              className="h-10 rounded-xl border-none bg-surface-container-low px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="category">Arriba del rubro</option>
              <option value="home">Home de la ciudad</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-on-surface-variant">
              Días
            </Label>
            <Input
              value={featDays}
              onChange={(e) => setFeatDays(e.target.value)}
              inputMode="numeric"
              className="h-10 w-24"
            />
          </div>
          <Button size="sm" onClick={handleFeature} disabled={featuring}>
            <MaterialIcon name="star" size="sm" />
            {featuring ? 'Asignando...' : 'Destacar'}
          </Button>
        </div>
        {featMsg && (
          <p className="text-xs text-on-surface-variant mt-2">{featMsg}</p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/40 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="font-semibold text-on-surface truncate">{value}</dd>
    </div>
  );
}
