'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useOrderStore } from '@/stores/order.store';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { useAuthStore } from '@/stores/auth.store';
import { useBillingStore } from '@/stores/billing.store';
import { useActivationStore } from '@/stores/activation.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Money } from '@/components/ui/money';
import { RecentOrdersList } from '@/components/dashboard/recent-orders-list';
import { ActivationPanel } from '@/components/activation/activation-panel';
import { OrderStatus, PlanTier, type AnalyticsOverview } from '@/types';
import { formatCurrency } from '@/lib/format';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

function WelcomeBanner({ name }: { name?: string }) {
  const params = useSearchParams();
  const invited = params.get('bienvenida') === '1';
  const created = params.get('nuevo') === '1';
  if (!invited && !created) return null;
  return (
    <section className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <MaterialIcon name="rocket_launch" size="md" />
      </span>
      <div>
        <p className="font-bold text-on-surface">
          {invited
            ? `${name ?? 'Tu local'} ya es tuyo.`
            : `Listo, ${name ?? 'tu local'} ya tiene su menú online.`}
        </p>
        <p className="mt-1 text-sm text-on-surface-variant">
          {invited
            ? 'Todo lo que estaba cargado quedó a tu nombre. Revisá los pasos de abajo antes de compartir el link: desde ahora los pedidos te llegan acá.'
            : 'Seguí los pasos de la puesta en marcha. En unos minutos vas a tener todo listo para recibir pedidos.'}
        </p>
      </div>
    </section>
  );
}

function todayLabel(): string {
  const label = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function StatTile({
  label,
  value,
  hint,
  icon,
  href,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: string;
  href?: string;
  tone?: 'default' | 'live' | 'whatsapp';
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            tone === 'live' && 'bg-primary/10 text-primary',
            tone === 'whatsapp' && 'bg-success-container text-success',
            tone === 'default' && 'bg-surface-container-low text-on-surface-variant',
          )}
        >
          <MaterialIcon name={icon} size="sm" />
        </span>
      </div>
      <p className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-on-surface-variant">{hint}</p>}
    </>
  );
  const className =
    'rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm transition-colors';
  return href ? (
    <Link href={href} className={cn(className, 'hover:border-primary/30')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-on-surface-variant/40">{children}</span>;
}

export default function DashboardPage() {
  const { orders, fetch: fetchOrders } = useOrderStore();
  const { restaurant, fetch: fetchRestaurant, fetchHours } = useRestaurantStore();
  const user = useAuthStore((s) => s.user);
  const billing = useBillingStore((s) => s.info);
  const fetchBilling = useBillingStore((s) => s.fetch);
  const activation = useActivationStore((s) => s.status);
  const fetchActivation = useActivationStore((s) => s.fetch);
  const [contactsToday, setContactsToday] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchRestaurant();
    fetchBilling();
    fetchHours();
    fetchActivation();
    let cancelled = false;
    api
      .get<AnalyticsOverview>('/analytics/overview?range=today')
      .then((data) => {
        if (!cancelled) setContactsToday(data.events?.whatsapp ?? 0);
      })
      .catch(() => {
        if (!cancelled) setContactsToday(null);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchOrders, fetchRestaurant, fetchBilling, fetchHours, fetchActivation]);

  const currency = restaurant?.currency ?? 'ARS';
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const activeOrders = orders.filter((o) =>
    [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERING].includes(o.status),
  );
  const newOrders = orders.filter((o) => o.status === OrderStatus.NEW);
  const soldToday = todayOrders
    .filter((o) => o.status !== OrderStatus.CANCELLED)
    .reduce((sum, o) => sum + o.total, 0);
  const recentOrders = orders.filter((o) => !o.redacted).slice(0, 6);

  const freeLimit = billing?.limits?.maxOrdersPerMonth ?? 100;
  const monthOrders = billing?.usage?.ordersThisMonth ?? 0;
  const isFree = billing?.plan === PlanTier.FREE;
  const nearFreeLimit = isFree && monthOrders >= 80 && monthOrders <= freeLimit;
  const slug = restaurant?.slug ?? user?.restaurantSlug;

  const openBoard = async (type: 'kitchen' | 'delivery') => {
    try {
      const tokens = await api.get<{ token: string }[]>(`/${type}/tokens`);
      if (tokens.length === 0) {
        toast.error(
          `Todavía no creaste un acceso de ${type === 'kitchen' ? 'cocina' : 'delivery'}. Lo hacés en Pedidos → Accesos.`,
        );
        return;
      }
      window.open(`${window.location.origin}/${type}/${tokens[0].token}`, '_blank');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo abrir el tablero');
    }
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <WelcomeBanner name={restaurant?.name} />
      </Suspense>

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface-variant">{todayLabel()}</p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-background md:text-4xl">
            Hola, {restaurant?.name || user?.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface transition-colors hover:border-primary/40"
            >
              <MaterialIcon name="storefront" size="sm" />
              Ver mi menú
            </a>
          )}
          <Link
            href="/mi-menu?tab=compartir"
            className="inline-flex h-10 items-center gap-2 rounded-xl gradient-cta px-4 text-sm font-bold text-white shadow-md shadow-primary/20"
          >
            <MaterialIcon name="share" size="sm" />
            Compartir
          </Link>
        </div>
      </section>

      {activation && <ActivationPanel status={activation} />}

      {newOrders.length > 0 && (
        <Link
          href="/orders"
          className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 transition-colors hover:bg-primary/15"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-primary" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <p className="flex-1 text-sm font-bold text-on-surface">
            {newOrders.length === 1
              ? 'Tenés un pedido nuevo esperando'
              : `Tenés ${newOrders.length} pedidos nuevos esperando`}
          </p>
          <span className="text-sm font-bold text-primary">Atender</span>
          <MaterialIcon name="arrow_forward" size="sm" className="text-primary" />
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Pedidos hoy"
          icon="receipt_long"
          value={todayOrders.length || <Muted>0</Muted>}
          href="/orders"
        />
        <StatTile
          label="Vendido hoy"
          icon="payments"
          value={soldToday > 0 ? <Money amount={soldToday} currency={currency} /> : <Muted>$0</Muted>}
        />
        <StatTile
          label="En curso"
          icon="hourglass_top"
          tone={activeOrders.length > 0 ? 'live' : 'default'}
          value={activeOrders.length || <Muted>0</Muted>}
          hint={activeOrders.length > 0 ? 'Entre nuevos, en cocina y en camino' : undefined}
          href="/orders"
        />
        <StatTile
          label="Te escribieron"
          icon="chat"
          tone="whatsapp"
          value={contactsToday === null ? <Muted>–</Muted> : contactsToday}
          hint="Por WhatsApp desde tu menú, hoy"
          href="/analytics"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm lg:col-span-2">
          {recentOrders.length > 0 ? (
            <RecentOrdersList orders={recentOrders} currency={currency} />
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-variant">
                <MaterialIcon name="receipt_long" size="lg" />
              </span>
              <div className="max-w-sm space-y-1">
                <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-on-surface">
                  Todavía no entraron pedidos
                </p>
                <p className="text-sm text-on-surface-variant">
                  Cuando alguien pida desde tu menú, el pedido aparece acá al instante y te suena el aviso.
                </p>
              </div>
              {slug && (
                <a
                  href={`/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
                >
                  <MaterialIcon name="touch_app" size="sm" />
                  Hacé un pedido de prueba
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-sm font-bold text-on-surface">Tableros de operación</p>
            <p className="-mt-2 text-xs text-on-surface-variant">
              Para la tablet de la cocina o el celular del repartidor, sin usuario ni contraseña.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openBoard('kitchen')}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-outline-variant/30 p-3 text-xs font-bold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <MaterialIcon name="restaurant" size="md" className="text-primary" />
                Cocina
              </button>
              <button
                type="button"
                onClick={() => openBoard('delivery')}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-outline-variant/30 p-3 text-xs font-bold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <MaterialIcon name="delivery_dining" size="md" className="text-primary" />
                Delivery
              </button>
            </div>
          </div>

          <Link
            href="/analytics"
            className="flex items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm transition-colors hover:border-primary/30"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MaterialIcon name="insights" size="md" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-on-surface">Análisis de ventas</p>
              <p className="text-xs text-on-surface-variant">Qué se vende, a qué hora y quién vuelve</p>
            </div>
            <MaterialIcon name="chevron_right" size="md" className="text-on-surface-variant" />
          </Link>

          {isFree && (
            <Link
              href="/billing"
              className={cn(
                'block rounded-2xl border p-5 transition-colors',
                nearFreeLimit
                  ? 'border-amber-300 bg-amber-50 hover:bg-amber-100/60'
                  : 'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-on-surface">Plan Gratis</p>
                <span className="text-xs font-bold text-on-surface-variant">
                  {monthOrders}/{freeLimit} pedidos
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                <div
                  className={cn('h-full rounded-full', nearFreeLimit ? 'bg-amber-500' : 'bg-primary')}
                  style={{ width: `${Math.min(100, (monthOrders / freeLimit) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">
                {nearFreeLimit
                  ? 'Estás cerca del límite del mes. Con Pro tenés pedidos ilimitados y sin marca.'
                  : `Pro: pedidos ilimitados y sin marca por ${formatCurrency(15000, 'ARS')}/mes, con 30 días gratis.`}
              </p>
            </Link>
          )}
          {billing?.plan === PlanTier.PRO && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <MaterialIcon name="workspace_premium" size="md" className="text-primary" />
              <p className="text-sm font-bold text-on-surface">Plan Pro activo</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
