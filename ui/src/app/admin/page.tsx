'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { RestaurantRow } from '@/components/admin/restaurant-row';
import { STAGE_META, STAGE_ORDER } from '@/components/admin/stage';
import { ActivityFeed } from '@/components/admin/activity-feed';
import { cn } from '@/lib/utils';
import type { AdminOverview, AdminRestaurantListItem } from '@/types';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 13) return 'Buen día';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-on-surface-variant">sin pedidos</span>;
  if (previous === 0) return <span className="font-bold text-success">primeros pedidos</span>;
  const change = Math.round(((current - previous) / previous) * 100);
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-bold', change >= 0 ? 'text-success' : 'text-error')}>
      <MaterialIcon name={change >= 0 ? 'arrow_upward' : 'arrow_downward'} size="xs" className="size-3" />
      {Math.abs(change)}% vs 7 días previos
    </span>
  );
}

function WorkList({
  title,
  hint,
  icon,
  items,
  empty,
  href,
  tone = 'default',
}: {
  title: string;
  hint: string;
  icon: string;
  items: AdminRestaurantListItem[];
  empty: string;
  href: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-2xl border bg-surface-container-lowest p-4 shadow-sm',
        tone === 'warning' ? 'border-amber-300' : 'border-outline-variant/20',
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            tone === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary',
          )}
        >
          <MaterialIcon name={icon} size="sm" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-on-surface">{title}</h2>
          <p className="text-xs text-on-surface-variant">{hint}</p>
        </div>
        {items.length > 0 && (
          <Link href={href} className="shrink-0 text-xs font-bold text-primary hover:underline">
            Ver todos
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl bg-surface-container-low px-3 py-4 text-center text-xs text-on-surface-variant">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <RestaurantRow key={item.id} item={item} dense />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AdminOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdminOverview>('/admin/overview')
      .then((overview) => {
        if (!cancelled) setData(overview);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el resumen');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-on-surface-variant">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface">
            Resumen
          </h1>
        </div>
        <Link
          href="/admin/locales/nuevo"
          className="hidden h-10 items-center gap-2 rounded-xl gradient-cta px-4 text-sm font-bold text-white shadow-md shadow-primary/20 sm:inline-flex"
        >
          <MaterialIcon name="add" size="sm" />
          Cargar un local
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-error-container/40 px-4 py-3 text-sm text-on-error-container">{error}</div>
      )}

      {!data && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container-high/60" />
          ))}
        </div>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STAGE_ORDER.map((stage, index) => {
              const meta = STAGE_META[stage];
              return (
                <Link
                  key={stage}
                  href={`/admin/locales?stage=${stage}`}
                  className={cn(
                    'group relative rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm transition-colors hover:border-primary/40',
                    stage === 'pausado' && data.pipeline.pausado === 0 && 'max-lg:hidden',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                    <span className="text-xs font-bold text-on-surface-variant">{meta.plural}</span>
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold text-on-surface">
                    {data.pipeline[stage]}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">{meta.hint}</p>
                  {index < 3 && (
                    <MaterialIcon
                      name="chevron_right"
                      size="sm"
                      className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-surface-container-low text-outline lg:block"
                    />
                  )}
                </Link>
              );
            })}
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Pedidos, 7 días</p>
              <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
                {data.platform.ordersLast7d}
              </p>
              <p className="text-xs">
                <Delta current={data.platform.ordersLast7d} previous={data.platform.ordersPrev7d} />
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Locales vendiendo
              </p>
              <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
                {data.platform.activeRestaurants7d}
              </p>
              <p className="text-xs text-on-surface-variant">con al menos un pedido esta semana</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Con carta</p>
              <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
                {data.inventory.withMenu}
                <span className="text-base text-on-surface-variant">/{data.pipeline.all}</span>
              </p>
              <p className="text-xs text-on-surface-variant">locales con platos cargados</p>
            </div>
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Fichas completas</p>
              <p className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
                {data.inventory.listingReady}
              </p>
              <p className="text-xs text-on-surface-variant">carta, WhatsApp, horarios, imagen y ubicación</p>
            </div>
          </section>

          {data.pendingClaims > 0 && (
            <Link
              href="/admin/reclamos"
              className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 transition-colors hover:bg-primary/15"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <MaterialIcon name="mark_email_unread" size="md" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-on-surface">
                  {data.pendingClaims === 1
                    ? 'Un dueño pidió su local'
                    : `${data.pendingClaims} dueños pidieron su local`}
                </p>
                <p className="text-xs text-on-surface-variant">
                  Verificalo por WhatsApp y aprobá: se genera la invitación sola.
                </p>
              </div>
              <MaterialIcon name="arrow_forward" size="md" className="text-primary" />
            </Link>
          )}

          {data.lists.ordersWithoutOwner.length > 0 && (
            <WorkList
              title="Toman pedidos y no tienen dueño"
              hint="Están publicados con carrito, pero nadie recibe esos pedidos. Invitá al dueño o pasalos a ficha."
              icon="warning"
              tone="warning"
              items={data.lists.ordersWithoutOwner}
              empty=""
              href="/admin/locales?stage=ficha"
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <WorkList
              title="Listas para invitar"
              hint="Fichas sin dueño con la carta y los datos casi completos."
              icon="send"
              items={data.lists.readyToInvite}
              empty="Ninguna ficha está lista todavía. Cargales carta, WhatsApp y horarios."
              href="/admin/locales?stage=ficha&sort=readiness"
            />
            <WorkList
              title="Te buscan y no tienen dueño"
              hint="Fichas con visitas o clicks a WhatsApp en los últimos 30 días."
              icon="visibility"
              items={data.lists.hotLeads}
              empty="Todavía no hay demanda registrada en fichas sin dueño."
              href="/admin/locales?sort=demand"
            />
            <WorkList
              title="Invitaciones por vencer"
              hint="Vencen en los próximos 3 días. Escribile al dueño o generá un link nuevo."
              icon="hourglass_top"
              items={data.lists.expiringInvitations}
              empty="No hay invitaciones por vencer."
              href="/admin/locales?stage=invitado"
            />
            <WorkList
              title="Dueños que no arrancaron"
              hint="Tienen su local pero no recibieron pedidos en 30 días."
              icon="support_agent"
              items={data.lists.stalledOwners}
              empty="Todos los dueños activos recibieron pedidos este mes."
              href="/admin/locales?stage=activo"
            />
          </div>

          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-heading)] text-sm font-bold text-on-surface">
                Actividad reciente
              </h2>
              <Link href="/admin/activity" className="text-xs font-bold text-primary hover:underline">
                Ver todo
              </Link>
            </div>
            <ActivityFeed entries={data.activity} showRestaurant />
          </section>
        </>
      )}
    </div>
  );
}
