'use client';

import { useEffect, useState } from 'react';
import { useOrderStore } from '@/stores/order.store';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { useAuthStore } from '@/stores/auth.store';
import { useBillingStore } from '@/stores/billing.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button } from '@/components/ui/button';
import { RecentOrdersList } from '@/components/dashboard/recent-orders-list';
import { OrderStatus, PlanTier, StorefrontData } from '@/types';
import { formatCurrency } from '@/lib/format';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface ChecklistStep {
  key: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  done: boolean;
}

export default function DashboardPage() {
  const { orders, fetch: fetchOrders } = useOrderStore();
  const {
    restaurant,
    fetch: fetchRestaurant,
    operatingHours,
    fetchHours,
  } = useRestaurantStore();
  const user = useAuthStore((s) => s.user);
  const billing = useBillingStore();
  const fetchBilling = useBillingStore((s) => s.fetch);
  const [menuHasItems, setMenuHasItems] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchRestaurant();
    fetchBilling();
    fetchHours();

    if (user?.restaurantSlug) {
      api
        .get<StorefrontData>(`/storefront/${user.restaurantSlug}`)
        .then((data) => setMenuHasItems(data.categories.some((c) => c.items.length > 0)))
        .catch(() => setMenuHasItems(false));
    }
  }, [fetchOrders, fetchRestaurant, fetchBilling, fetchHours, user?.restaurantSlug]);

  const paymentMethods = restaurant?.paymentMethods;
  const paymentsConfigured = !!(
    paymentMethods &&
    (paymentMethods.cashEnabled ||
      paymentMethods.cardEnabled ||
      paymentMethods.transferEnabled ||
      paymentMethods.transferCbu ||
      paymentMethods.transferAlias)
  );
  const hoursConfigured = operatingHours.length > 0;

  const steps: ChecklistStep[] = [
    {
      key: 'menu',
      title: 'Completá tu menú',
      description: menuHasItems
        ? 'Tu menú tiene productos listos para que pidan.'
        : 'Subí tus platos y bebidas para que tus clientes puedan pedirlos.',
      icon: 'restaurant',
      href: '/menu',
      done: menuHasItems,
    },
    {
      key: 'payments',
      title: 'Configurá los pagos',
      description: paymentsConfigured
        ? 'Ya tenés un método de pago configurado.'
        : 'Elegí cómo querés cobrar: efectivo, tarjeta o transferencia.',
      icon: 'payments',
      href: '/settings?tab=pagos',
      done: paymentsConfigured,
    },
    {
      key: 'hours',
      title: 'Definí tus horarios',
      description: hoursConfigured
        ? 'Tus horarios están configurados.'
        : 'Indicá cuándo está abierto tu local para recibir pedidos.',
      icon: 'schedule',
      href: '/settings?tab=horarios',
      done: hoursConfigured,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progressPct = Math.round((doneCount / totalSteps) * 100);
  const allReady = doneCount === totalSteps;

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const activeOrders = orders.filter((o) => [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status));
  const todayRevenue = todayOrders.filter((o) => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.total, 0);
  const deliveredToday = todayOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
  const avgTicket = deliveredToday > 0 ? todayRevenue / deliveredToday : 0;

  const recentOrders = orders.filter((o) => !o.redacted).slice(0, 5);
  const hasSales = orders.length > 0;

  const freeOrdersLimit = billing.info?.limits?.maxOrdersPerMonth ?? 100;
  const ordersThisMonth = billing.info?.usage?.ordersThisMonth ?? 0;
  const nearFreeLimit = billing.info?.plan === PlanTier.FREE && ordersThisMonth >= 80 && ordersThisMonth <= freeOrdersLimit;

  const openBoard = async (type: 'kitchen' | 'delivery') => {
    try {
      const tokens = await api.get<{ token: string }[]>(`/${type}/tokens`);
      if (tokens.length === 0) {
        toast.error(`No hay accesos de ${type === 'kitchen' ? 'cocina' : 'delivery'}. Creá uno en Pedidos → Accesos.`);
        return;
      }
      window.open(`${window.location.origin}/${type}/${tokens[0].token}`, '_blank');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al abrir el tablero');
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>
            Hola, {restaurant?.name || user?.name}!
          </h1>
          {billing.info?.plan === PlanTier.PRO && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <MaterialIcon name="workspace_premium" size="xs" />
              Plan Pro
            </span>
          )}
        </div>
        <p className="text-on-surface-variant text-lg">
          {allReady
            ? (todayOrders.length > 0
                ? `Tenés ${todayOrders.length} pedido${todayOrders.length === 1 ? '' : 's'} hoy.`
                : 'Tu cuenta está lista. Compartí tu menú para empezar a recibir pedidos.')
            : 'Completá estos pasos y tu menú va a estar listo para recibir pedidos.'}
        </p>
      </section>

      {/* Próximos pasos */}
      <section className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0">
              <MaterialIcon name={allReady ? 'check_circle' : 'flag'} size="lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
                {allReady ? '¡Todo listo para recibir pedidos!' : 'Tus próximos pasos'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {allReady
                  ? 'Configuraste lo esencial. Ahora compartí tu menú y empezá a recibir pedidos.'
                  : `${doneCount} de ${totalSteps} completados · ${progressPct}%`}
              </p>
            </div>
          </div>
          <div className="w-full md:w-40 h-2.5 rounded-full bg-surface-container-low overflow-hidden">
            <div
              className="h-full rounded-full gradient-cta transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step) => {
            const done = step.done;
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`group flex items-start gap-3 rounded-xl border p-4 transition-all ${
                  done
                    ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                    : 'border-outline-variant/20 bg-surface-container-low/40 hover:bg-surface-container-low'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    done ? 'bg-primary/10 text-primary' : 'bg-white text-on-surface-variant'
                  }`}
                >
                  <MaterialIcon name={done ? 'check' : step.icon} size="md" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-sm ${done ? 'text-primary' : 'text-on-surface'}`}>{step.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{step.description}</p>
                </div>
                {!done && <MaterialIcon name="chevron_right" size="sm" className="ml-auto mt-1 shrink-0 text-on-surface-variant group-hover:text-primary" />}
              </Link>
            );
          })}
        </div>

        {!allReady && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/10 pt-4">
            <p className="text-sm text-on-surface-variant">
              ¿Ya configuraste todo? Asegurate de que tu menú esté compartido para que tus clientes puedan verlo.
            </p>
            <Link href="/mi-menu?tab=compartir">
              <Button size="sm" className="gradient-cta text-white">
                <MaterialIcon name="share" size="sm" className="mr-1" />Compartir mi menú
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Pedidos Hoy</p>
          <p className="text-2xl font-extrabold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
            {todayOrders.length || <span className="text-on-surface-variant/30">0</span>}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-2xl font-extrabold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
            {todayRevenue > 0 ? formatCurrency(todayRevenue, restaurant?.currency) : <span className="text-on-surface-variant/30">$0</span>}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Activos</p>
          <p className="text-2xl font-extrabold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
            {activeOrders.length || <span className="text-on-surface-variant/30">0</span>}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Ticket Promedio</p>
          <p className="text-2xl font-extrabold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
            {avgTicket > 0 ? formatCurrency(avgTicket, restaurant?.currency) : <span className="text-on-surface-variant/30">$0</span>}
          </p>
        </div>
      </section>

      {/* Pedidos recientes + operacion rapida */}
      <section className="space-y-4">
        <div className="px-2">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Pedidos Recientes</h2>
        </div>

        {!hasSales ? (
          <div className="bg-white rounded-2xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-outline-variant/20">
            <div className="w-full max-w-lg opacity-10 flex items-end justify-between h-32 gap-4 px-8">
              <div className="flex-1 bg-on-surface-variant rounded-t-lg h-[20%]" />
              <div className="flex-1 bg-on-surface-variant rounded-t-lg h-[35%]" />
              <div className="flex-1 bg-on-surface-variant rounded-t-lg h-[15%]" />
              <div className="flex-1 bg-on-surface-variant rounded-t-lg h-[50%]" />
              <div className="flex-1 bg-on-surface-variant rounded-t-lg h-[25%]" />
              <div className="flex-1 bg-on-surface-variant rounded-t-lg h-[40%]" />
              <div className="flex-1 bg-on-surface-variant rounded-t-lg h-[10%]" />
            </div>
            <div className="space-y-2 max-w-sm">
              <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialIcon name="analytics" size="xl" className="text-on-surface-variant/30" />
              </div>
              <h3 className="text-xl font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>Esperando tus primeros pedidos</h3>
              <p className="text-on-surface-variant">Una vez que tus clientes empiecen a pedir, aqui veras la actividad de tu restaurante en tiempo real.</p>
            </div>
            <Link
              href="/mi-menu?tab=compartir"
              className="inline-flex items-center gap-2 gradient-cta text-white px-6 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              <MaterialIcon name="rocket_launch" size="md" />
              Compartir mi Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 lg:col-span-2">
              <RecentOrdersList orders={recentOrders} currency={restaurant?.currency} />
            </div>
            <div className="space-y-4">
              {activeOrders.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10 space-y-3">
                  <p className="text-sm font-bold text-on-surface">
                    {activeOrders.length} pedido{activeOrders.length === 1 ? '' : 's'} en curso
                  </p>
                  <p className="text-xs text-on-surface-variant -mt-2">
                    Operá en tiempo real desde los tableros
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" size="sm" onClick={() => openBoard('kitchen')}>
                      <MaterialIcon name="restaurant" size="sm" className="mr-1" />Abrir Cocina
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openBoard('delivery')}>
                      <MaterialIcon name="delivery_dining" size="sm" className="mr-1" />Abrir Delivery
                    </Button>
                  </div>
                </div>
              )}
              <Link href="/analytics" className="block">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <MaterialIcon name="insights" size="md" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Análisis de ventas</p>
                      <p className="text-xs text-on-surface-variant">Hoy, 7 y 30 días</p>
                    </div>
                  </div>
                  <MaterialIcon name="chevron_right" size="md" className="text-on-surface-variant" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Plan banner */}
      {billing.info?.plan === PlanTier.FREE && (
        <>
          {nearFreeLimit && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <MaterialIcon name="info" size="md" className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Estás cerca del límite del plan gratis</p>
                <p className="text-sm text-amber-800">Con Pro tenés pedidos ilimitados + estadísticas + sin marca.</p>
              </div>
            </section>
          )}
          <section className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MaterialIcon name="workspace_premium" size="lg" />
              </div>
              <div>
                <p className="font-bold">Plan Gratis · {freeOrdersLimit} pedidos/mes</p>
                <p className="text-sm text-on-surface-variant">Subí a Pro por {formatCurrency(15000, 'ARS')}/mes con 30 días gratis: pedidos ilimitados y sin marca quiero.menu.</p>
              </div>
            </div>
            <Link href="/billing">
              <Button size="sm" className="gradient-cta text-white">
                <MaterialIcon name="bolt" size="sm" className="mr-1" />Subir a Pro
              </Button>
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
