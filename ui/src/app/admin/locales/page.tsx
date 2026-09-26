'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { MaterialIcon } from '@/components/ui/material-icon';
import { RestaurantRow } from '@/components/admin/restaurant-row';
import { STAGE_META, STAGE_ORDER } from '@/components/admin/stage';
import { RESTAURANT_CATEGORIES } from '@/lib/restaurant-categories';
import { cn } from '@/lib/utils';
import type {
  AdminListSort,
  AdminRestaurantListItem,
  AdminRestaurantListResponse,
  AdminStage,
} from '@/types';

const SORTS: { value: AdminListSort; label: string }[] = [
  { value: 'recent', label: 'Más nuevos' },
  { value: 'demand', label: 'Más buscados' },
  { value: 'readiness', label: 'Más completos' },
  { value: 'name', label: 'Por nombre' },
];

const SELECT =
  'h-10 rounded-xl border-none bg-surface-container-lowest px-3 text-sm font-semibold text-on-surface shadow-sm outline-none ring-1 ring-outline-variant/30 focus-visible:ring-2 focus-visible:ring-primary/40';

interface Loaded {
  key: string;
  response: AdminRestaurantListResponse;
  items: AdminRestaurantListItem[];
}

function LocalesList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const stage = (params.get('stage') as AdminStage | null) ?? null;
  const q = params.get('q') ?? '';
  const city = params.get('city') ?? '';
  const category = params.get('category') ?? '';
  const sort = (params.get('sort') as AdminListSort | null) ?? 'recent';

  const [term, setTerm] = useState(q);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const queryKey = useMemo(() => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (stage) qs.set('stage', stage);
    if (city) qs.set('city', city);
    if (category) qs.set('category', category);
    qs.set('sort', sort);
    return qs.toString();
  }, [q, stage, city, category, sort]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (term === q) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(window.location.search);
      if (term.trim()) next.set('q', term.trim());
      else next.delete('q');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);
    return () => clearTimeout(handle);
  }, [term, q, pathname, router]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdminRestaurantListResponse>(`/admin/restaurants?${queryKey}&page=1&limit=25`)
      .then((response) => {
        if (cancelled) return;
        setError('');
        setLoaded({ key: queryKey, response, items: response.items });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el listado');
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  const loadMore = async () => {
    if (!loaded || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = loaded.response.page + 1;
      const response = await api.get<AdminRestaurantListResponse>(
        `/admin/restaurants?${loaded.key}&page=${nextPage}&limit=25`,
      );
      setLoaded((current) =>
        current && current.key === loaded.key
          ? { key: current.key, response, items: [...current.items, ...response.items] }
          : current,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar más locales');
    } finally {
      setLoadingMore(false);
    }
  };

  const stale = loaded?.key !== queryKey;
  const counts = loaded?.response.stages;
  const cities = loaded?.response.cities ?? [];
  const hasFilters = Boolean(q || city || category);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
            Locales
          </h1>
          <p className="text-sm text-on-surface-variant">
            {counts ? `${counts.all} en total` : 'Cargando...'} · de la ficha al local que paga
          </p>
        </div>
        <Link
          href="/admin/locales/nuevo"
          className="hidden h-10 items-center gap-2 rounded-xl gradient-cta px-4 text-sm font-bold text-white shadow-md shadow-primary/20 sm:inline-flex"
        >
          <MaterialIcon name="add" size="sm" />
          Cargar un local
        </Link>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          <button
            type="button"
            onClick={() => setParam('stage', null)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition-colors',
              !stage ? 'bg-on-surface text-surface' : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/30 hover:text-on-surface',
            )}
          >
            Todos {counts && <span className="ml-1 opacity-70">{counts.all}</span>}
          </button>
          {STAGE_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setParam('stage', s)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                stage === s
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-lowest text-on-surface-variant ring-1 ring-outline-variant/30 hover:text-on-surface',
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', STAGE_META[s].dot)} />
              {STAGE_META[s].plural}
              {counts && <span className="opacity-70">{counts[s]}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <MaterialIcon
            name="search"
            size="sm"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Nombre, slug o email del dueño"
            className="h-10 bg-surface-container-lowest pl-10 shadow-sm ring-1 ring-outline-variant/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:contents">
          <select value={city} onChange={(e) => setParam('city', e.target.value || null)} className={SELECT} aria-label="Ciudad">
            <option value="">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.citySlug} value={c.citySlug}>
                {c.city} ({c.count})
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setParam('category', e.target.value || null)}
            className={SELECT}
            aria-label="Rubro"
          >
            <option value="">Todos los rubros</option>
            {RESTAURANT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className={cn(SELECT, 'col-span-2 sm:col-span-1')}
            aria-label="Orden"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</div>}

      <div className={cn('space-y-2 transition-opacity', stale && loaded && 'opacity-50')}>
        {!loaded &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-surface-container-high/60" />
          ))}

        {loaded && loaded.items.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-outline-variant/40 px-6 py-14 text-center">
            <MaterialIcon name="search_off" size="xl" className="mx-auto text-outline" />
            <p className="mt-3 font-bold text-on-surface">
              {hasFilters || stage ? 'No hay locales con esos filtros' : 'Todavía no hay locales cargados'}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {hasFilters || stage
                ? 'Probá sacar algún filtro o buscar por otro nombre.'
                : 'Cargá la primera ficha y armá el local antes de ir a verlo.'}
            </p>
          </div>
        )}

        {loaded?.items.map((item) => <RestaurantRow key={item.id} item={item} />)}
      </div>

      {loaded && loaded.response.page < loaded.response.pages && (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-on-surface shadow-sm ring-1 ring-outline-variant/30 transition-colors hover:ring-primary/40 disabled:opacity-60"
          >
            {loadingMore ? 'Cargando...' : 'Ver más'}
          </button>
          <p className="text-xs text-on-surface-variant">
            Mostrando {loaded.items.length} de {loaded.response.total}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminLocalesPage() {
  return (
    <Suspense fallback={null}>
      <LocalesList />
    </Suspense>
  );
}
