'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useOrderStore } from '@/stores/order.store';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { useAuthStore } from '@/stores/auth.store';
import { useActivationStore } from '@/stores/activation.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Money } from '@/components/ui/money';
import { RecentOrdersList } from '@/components/dashboard/recent-orders-list';
import { SupportWhatsAppBanner } from '@/components/dashboard/support-whatsapp-banner';
import { ActivationPanel } from '@/components/activation/activation-panel';
import { ShareMenuCard } from '@/components/dashboard/share-menu-card';
import { OrderStatus } from '@/types';
import { api } from '@/lib/api';
import { READINESS_BY_KEY } from '@/lib/readiness';
import { cn } from '@/lib/utils';

function WelcomeBanner({ name }: { name?: string }) {
  const params = useSearchParams();
  if (params.get('bienvenida') !== '1' && params.get('nuevo') !== '1') return null;
  return <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-on-surface">
    <p className="font-bold">{name ?? 'Tu local'} ya tiene su lugar acá.</p>
    <p className="mt-1 text-on-surface-variant">Empezá por tus productos. Podés completar el resto a tu ritmo.</p>
  </section>;
}

export default function DashboardPage() {
  const { orders, meta, isLoading: ordersLoading, fetch: fetchOrders } = useOrderStore();
  const { restaurant, isOpen, todayHours, operatingHours, closesAtLabel, localTime, fetch: fetchRestaurant, fetchHours } = useRestaurantStore();
  const user = useAuthStore((state) => state.user);
  const activation = useActivationStore((state) => state.status);
  const fetchActivation = useActivationStore((state) => state.fetch);
  const [ordersError, setOrdersError] = useState(false);
  const [hoursError, setHoursError] = useState(false);
  const slug = restaurant?.slug ?? user?.restaurantSlug;
  const nextStepKey = activation?.summary.next ?? activation?.summary.missing[0];
  const nextStep = nextStepKey ? READINESS_BY_KEY[nextStepKey] : null;

  useEffect(() => {
    void fetchOrders().catch(() => setOrdersError(true));
    void fetchRestaurant().catch(() => toast.error('No pudimos actualizar los datos de tu local.'));
    void fetchHours().catch(() => setHoursError(true));
    void fetchActivation().catch(() => toast.error('No pudimos actualizar la puesta en marcha.'));
  }, [fetchOrders, fetchRestaurant, fetchHours, fetchActivation]);

  const newOrders = orders.filter((order) => order.status === OrderStatus.NEW);
  const preparingOrders = orders.filter((order) => order.status === OrderStatus.PREPARING);
  const readyOrders = orders.filter((order) => [OrderStatus.READY, OrderStatus.DELIVERING].includes(order.status));
  const activeOrders = [...newOrders, ...preparingOrders, ...readyOrders];
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString());
  const soldToday = todayOrders.filter((order) => order.status !== OrderStatus.CANCELLED).reduce((total, order) => total + order.total, 0);
  const visibleOrders = (activeOrders.length > 0 ? activeOrders : orders).filter((order) => !order.redacted).slice(0, 5);
  const ordersReady = meta !== null;
  const currency = restaurant?.currency ?? 'ARS';
  const date = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const todayRanges = operatingHours.filter((hours) => hours.dayOfWeek === todayHours?.dayOfWeek && !hours.isClosed);
  const hoursLabel = restaurant?.openOverride
    ? `${isOpen ? 'Abierto' : 'Cerrado'} manualmente`
    : isOpen && closesAtLabel
      ? `Cierra a las ${closesAtLabel}`
      : todayRanges.length > 0
        ? todayRanges.map((hours) => `${hours.opensAt} – ${hours.closesAt}`).join(' · ')
        : todayHours?.isClosed
          ? 'Hoy no hay atención programada'
          : 'Configurá cuándo atendés';

  const openBoard = async (type: 'kitchen' | 'delivery') => {
    try {
      const tokens = await api.get<{ token: string }[]>(`/${type}/tokens`);
      if (!tokens.length) {
        toast.error(`Todavía no creaste una pantalla de ${type === 'kitchen' ? 'cocina' : 'delivery'}. Lo hacés en Pedidos → Pantallas.`);
        return;
      }
      window.open(`${window.location.origin}/${type}/${tokens[0].token}`, '_blank');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'No se pudo abrir el tablero');
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Suspense fallback={null}><WelcomeBanner name={restaurant?.name} /></Suspense>

      <header className="flex flex-col gap-5 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold capitalize text-on-surface-variant">{date}</p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">Hoy, todo a mano.</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {restaurant?.name && <span className="font-semibold text-on-surface">{restaurant.name} · </span>}
            Tu día, tus pedidos y tu menú.
          </p>
        </div>
        <Link href="/menu" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-container sm:self-auto">
          <MaterialIcon name="restaurant_menu" size="sm" />
          Editar mi menú
          <MaterialIcon name="arrow_forward" size="sm" />
        </Link>
      </header>

      {newOrders.length > 0 && (
        <Link href="/orders" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm font-bold text-on-surface transition-colors hover:bg-primary/15">
          <span className="relative h-3 w-3 shrink-0"><span className="animate-ping-soft absolute inset-0 rounded-full bg-primary" /><span className="absolute inset-0 rounded-full bg-primary" /></span>
          <span className="min-w-0 flex-1">{newOrders.length === 1 ? 'Tenés un pedido por aceptar' : `Tenés ${newOrders.length} pedidos por aceptar`}</span>
          <span className="text-primary">Atender</span>
          <MaterialIcon name="arrow_forward" size="sm" className="shrink-0 text-primary" />
        </Link>
      )}

      <section aria-label="Puesta en marcha y ayuda" className="space-y-3">
        {activation && activation.summary.done < activation.summary.total && (
          <details className="group overflow-hidden rounded-3xl border border-primary/20 bg-primary/5">
            <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-4 sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MaterialIcon name="tune" size="md" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-on-surface">Puesta en marcha</span>
                <span className="mt-1 block text-xs text-on-surface-variant">
                  {activation.summary.done} de {activation.summary.total} pasos listos.
                  {nextStep && <> Siguiente: <span className="font-semibold text-on-surface">{nextStep.title}</span></>}
                </span>
              </span>
              <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-primary/10 sm:block" aria-hidden="true"><span className="block h-full rounded-full bg-primary" style={{ width: `${activation.summary.percent}%` }} /></span>
              <MaterialIcon name="expand_more" size="sm" className="shrink-0 text-primary transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-primary/15 p-3"><ActivationPanel status={activation} /></div>
          </details>
        )}
        <SupportWhatsAppBanner restaurantName={restaurant?.name} />
      </section>

      <section aria-label="Resumen de hoy" aria-busy={ordersLoading} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: 'Vendido hoy', value: <Money amount={soldToday} currency={currency} />, icon: 'payments', detail: 'Sin pedidos cancelados', featured: true },
          { label: 'Pedidos hoy', value: todayOrders.length, icon: 'receipt_long', detail: 'Recibidos durante el día', featured: false },
          { label: 'En curso', value: activeOrders.length, icon: 'restaurant', detail: activeOrders.length > 0 ? 'Pendientes de entregar' : 'Todo al día', featured: false },
        ].map((stat) => (
          <Link key={stat.label} href="/orders" className={cn(
            'min-w-0 rounded-2xl border p-4 transition-colors hover:border-primary/40 sm:p-5',
            stat.featured ? 'col-span-2 border-primary/20 bg-surface-container sm:col-span-1' : 'border-outline-variant/30 bg-surface-container-lowest',
          )}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-on-surface-variant">{stat.label}</p>
              <MaterialIcon name={stat.icon} size="sm" className={stat.featured ? 'text-primary' : 'text-outline'} />
            </div>
            <p className="mt-3 break-words font-[family-name:var(--font-heading)] text-2xl font-extrabold tabular-nums tracking-tight text-on-surface sm:text-3xl">
              {ordersReady ? stat.value : <span aria-label={ordersError ? 'No disponible' : 'Cargando'}>—</span>}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">{stat.detail}</p>
          </Link>
        ))}
      </section>

      <div className="grid items-start gap-5 min-[75rem]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <section aria-labelledby="today-orders-heading" className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 p-4 sm:p-5">
              <div>
                <h2 id="today-orders-heading" className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface">Pedidos y operación</h2>
                <p className="mt-1 text-xs text-on-surface-variant">{activeOrders.length > 0 ? 'Primero, lo que necesita tu atención.' : 'Un vistazo a la actividad de tu local.'}</p>
              </div>
              <Link href="/orders" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-primary hover:bg-primary/5">
                Ver pedidos<MaterialIcon name="arrow_forward" size="sm" />
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-container-low p-3">
                {[
                  { label: 'Por aceptar', count: newOrders.length },
                  { label: 'Preparando', count: preparingOrders.length },
                  { label: 'Listos / en camino', count: readyOrders.length },
                ].map((stage) => (
                  <div key={stage.label} className="min-w-0 text-center">
                    <p className={cn('text-xl font-extrabold tabular-nums', stage.count > 0 ? 'text-primary' : 'text-on-surface')}>{ordersReady ? stage.count : '—'}</p>
                    <p className="mt-1 text-[11px] font-medium text-on-surface-variant">{stage.label}</p>
                  </div>
                ))}
              </div>

              {ordersError ? (
                <div role="alert" className="mt-4 rounded-2xl border border-error/20 bg-error-container/30 p-4">
                  <p className="text-sm text-on-surface">No pudimos actualizar tus pedidos.</p>
                  <button type="button" disabled={ordersLoading} onClick={() => void fetchOrders().then(() => setOrdersError(false)).catch(() => setOrdersError(true))} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary disabled:opacity-50">
                    <MaterialIcon name="refresh" size="sm" />{ordersLoading ? 'Actualizando…' : 'Reintentar'}
                  </button>
                </div>
              ) : !ordersReady ? (
                <p role="status" className="py-10 text-center text-sm text-on-surface-variant">Cargando la actividad de tu local…</p>
              ) : visibleOrders.length > 0 ? (
                <div className="mt-5"><RecentOrdersList orders={visibleOrders} currency={currency} title={activeOrders.length > 0 ? 'En curso' : 'Últimos pedidos'} showViewAll={false} /></div>
              ) : (
                <div className="flex flex-col items-center px-3 py-7 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-container text-success"><MaterialIcon name={activeOrders.length > 0 ? 'receipt_long' : 'check_circle'} size="lg" /></span>
                  <h3 className="mt-3 font-[family-name:var(--font-heading)] text-base font-extrabold text-on-surface">{activeOrders.length > 0 ? 'Tenés pedidos en curso' : 'Sin pedidos pendientes'}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-on-surface-variant">{activeOrders.length > 0 ? 'Entrá a Pedidos para ver la actividad disponible en tu plan.' : 'Cuando llegue un pedido, lo vas a encontrar acá. Mientras tanto, podés actualizar tu carta o compartir tu link.'}</p>
                  <Link href={activeOrders.length > 0 ? '/orders' : '/menu'} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary/5">{activeOrders.length > 0 ? 'Ir a pedidos' : 'Ir a mi menú'}<MaterialIcon name="arrow_forward" size="sm" /></Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/20 px-4 py-3 sm:px-5">
              <span className="mr-1 text-xs font-semibold text-on-surface-variant">Pantallas</span>
              <button type="button" onClick={() => void openBoard('kitchen')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/30 px-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"><MaterialIcon name="restaurant" size="sm" />Cocina</button>
              <button type="button" onClick={() => void openBoard('delivery')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/30 px-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"><MaterialIcon name="delivery_dining" size="sm" />Delivery</button>
            </div>
          </section>

          <section aria-labelledby="today-actions-heading" className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-5">
            <h2 id="today-actions-heading" className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface">¿Qué querés hacer hoy?</h2>
            <p className="mt-1 text-xs text-on-surface-variant">Los cambios de todos los días, a un toque.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 min-[75rem]:grid-cols-1 min-[90rem]:grid-cols-3">
              {[
                { href: '/menu', icon: 'restaurant_menu', title: 'Editar la carta', description: 'Productos y precios' },
                { href: '/promos', icon: 'confirmation_number', title: 'Promociones', description: 'Ofertas para tus clientes' },
                { href: '/mi-menu?tab=diseno', icon: 'palette', title: 'Diseñar el menú', description: 'Logo, portada y colores' },
              ].map((action) => (
                <Link key={action.href} href={action.href} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-outline-variant/20 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5 sm:flex-col sm:items-start min-[75rem]:flex-row min-[75rem]:items-center min-[90rem]:flex-col min-[90rem]:items-start">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MaterialIcon name={action.icon} size="sm" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-on-surface">{action.title}</span><span className="mt-1 block text-xs text-on-surface-variant">{action.description}</span></span>
                  <MaterialIcon name="arrow_forward" size="sm" className="shrink-0 text-outline transition-colors group-hover:text-primary sm:hidden min-[75rem]:block min-[90rem]:hidden" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside aria-label="Tu menú público y horarios" className="grid min-w-0 gap-5 sm:grid-cols-2 min-[75rem]:grid-cols-1">
          {slug && <ShareMenuCard />}
          <section aria-labelledby="today-hours-heading" className="min-w-0 self-start rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant"><MaterialIcon name="schedule" size="sm" /></span>
              <h2 id="today-hours-heading" className="text-sm font-bold text-on-surface">Tu local hoy</h2>
            </div>
            <div className="mt-4 rounded-2xl bg-surface-container-low p-3">
              <p className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', localTime && !hoursError && isOpen ? 'bg-success' : 'bg-outline')} />
                {hoursError ? 'Estado no disponible' : !localTime ? 'Consultando horario…' : isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{hoursError ? 'Revisá tus horarios en Ajustes.' : localTime ? hoursLabel : 'El estado se actualiza según tus horarios.'}</p>
            </div>
            <Link href="/business/hours" className="mt-3 flex min-h-11 items-center justify-between gap-2 rounded-xl px-1 text-sm font-bold text-primary hover:bg-primary/5">Gestionar horarios<MaterialIcon name="arrow_forward" size="sm" /></Link>
          </section>
        </aside>
      </div>

    </div>
  );
}
