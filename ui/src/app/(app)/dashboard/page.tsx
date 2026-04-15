'use client';

import { useEffect } from 'react';
import { useOrderStore } from '@/stores/order.store';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { useAuthStore } from '@/stores/auth.store';
import { useMenuStore } from '@/stores/menu.store';
import { MaterialIcon } from '@/components/ui/material-icon';
import { OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';

export default function DashboardPage() {
  const { orders, fetch: fetchOrders } = useOrderStore();
  const { restaurant, fetch: fetchRestaurant } = useRestaurantStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchOrders();
    fetchRestaurant();
  }, []);

  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const activeOrders = orders.filter((o) => [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status));
  const todayRevenue = todayOrders.filter((o) => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.total, 0);
  const deliveredToday = todayOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
  const avgTicket = deliveredToday > 0 ? todayRevenue / deliveredToday : 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-background" style={{ fontFamily: 'var(--font-heading)' }}>
          Hola, {restaurant?.name || user?.name}!
        </h1>
        <p className="text-on-surface-variant text-lg">Solo faltan unos pasos para empezar a recibir pedidos.</p>
      </section>

      {/* Onboarding Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task 1 - Menu */}
        <div className="group bg-white p-6 rounded-2xl transition-all hover:shadow-ambient border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container-low rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="mb-4 w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary">
            <MaterialIcon name="restaurant" size="lg" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>Completar tu Menu</h3>
          <p className="text-sm text-on-surface-variant mb-6">Sube tus mejores platos y bebidas con fotos tentadoras.</p>
          <Link
            href="/menu"
            className="block w-full gradient-cta text-white py-2.5 rounded-xl font-bold text-sm text-center active:scale-95 duration-200 transition-transform"
          >
            Ir al Menu
          </Link>
        </div>

        {/* Task 2 - Delivery Zones */}
        <div className="group bg-white p-6 rounded-2xl transition-all hover:shadow-ambient border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container-low rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="mb-4 w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary">
            <MaterialIcon name="local_shipping" size="lg" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>Zonas de entrega</h3>
          <p className="text-sm text-on-surface-variant mb-6">Define hasta donde llegas y tus costos de envio.</p>
          <Link
            href="/settings?tab=delivery"
            className="block w-full bg-surface-container-low text-primary border border-outline-variant/20 py-2.5 rounded-xl font-bold text-sm text-center active:scale-95 duration-200 transition-transform"
          >
            Configurar
          </Link>
        </div>

        {/* Task 3 - Share Link */}
        <div className="group bg-white p-6 rounded-2xl transition-all hover:shadow-ambient border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container-low rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="mb-4 w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary">
            <MaterialIcon name="share" size="lg" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>Compartir tu Menu</h3>
          <p className="text-sm text-on-surface-variant mb-6">Comparti tu link con clientes por WhatsApp o con un QR en tu local.</p>
          <Link
            href="/mi-menu"
            className="block w-full bg-surface-container-low text-primary border border-outline-variant/20 py-2.5 rounded-xl font-bold text-sm text-center active:scale-95 duration-200 transition-transform"
          >
            Ver mi link
          </Link>
        </div>
      </section>

      {/* Analytics Empty State */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Ventas Recientes</h2>
          <span className="text-sm font-medium text-on-surface-variant">Ultimos 7 dias</span>
        </div>

        {todayOrders.length === 0 ? (
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
              <p className="text-on-surface-variant">Una vez que tus clientes empiecen a pedir, aqui veras el crecimiento de tu restaurante en tiempo real.</p>
            </div>
            <Link
              href="/mi-menu"
              className="inline-flex items-center gap-2 gradient-cta text-white px-6 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
            >
              <MaterialIcon name="rocket_launch" size="md" />
              Compartir mi Menu
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-ambient">
            <p className="text-on-surface-variant text-sm">Tienes {todayOrders.length} pedidos hoy.</p>
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
    </div>
  );
}
