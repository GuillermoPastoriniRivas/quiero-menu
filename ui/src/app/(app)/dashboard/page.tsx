'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
import { ManualMenuWorkspace } from '@/components/dashboard/manual-menu-workspace';
import { ShareMenuCard } from '@/components/dashboard/share-menu-card';
import { OrderStatus, type StorefrontData } from '@/types';
import { api } from '@/lib/api';

function WelcomeBanner({ name }: { name?: string }) {
  const params = useSearchParams();
  if (params.get('bienvenida') !== '1' && params.get('nuevo') !== '1') return null;
  return <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-on-surface">
    <p className="font-bold">{name ?? 'Tu local'} ya tiene su lugar acá.</p>
    <p className="mt-1 text-on-surface-variant">Empezá por tus productos. Podés completar el resto a tu ritmo.</p>
  </section>;
}

function TestOrderCard({ slug }: { slug: string }) {
  return <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
    <p className="text-sm font-bold text-on-surface">Probá cómo llega un pedido</p>
    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">Abrí tu carta y recorré el mismo camino que tus clientes. Si confirmás un pedido, se registra de verdad.</p>
    <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary">Abrir mi carta<MaterialIcon name="arrow_outward" size="sm" /></a>
  </section>;
}

export default function DashboardPage() {
  const { orders, fetch: fetchOrders } = useOrderStore();
  const { restaurant, fetch: fetchRestaurant, fetchHours } = useRestaurantStore();
  const user = useAuthStore((state) => state.user);
  const activation = useActivationStore((state) => state.status);
  const fetchActivation = useActivationStore((state) => state.fetch);
  const [menu, setMenu] = useState<StorefrontData | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const loadVersion = useRef(0);
  const slug = restaurant?.slug ?? user?.restaurantSlug;

  useEffect(() => {
    void fetchOrders();
    void fetchRestaurant();
    void fetchHours();
    void fetchActivation();
  }, [fetchOrders, fetchRestaurant, fetchHours, fetchActivation]);

  const loadMenu = useCallback(async () => {
    if (!slug) return;
    const version = ++loadVersion.current;
    setMenuLoading(true);
    try {
      const data = await api.get<StorefrontData>(`/storefront/${slug}`);
      if (version === loadVersion.current) {
        setMenu(data);
        setMenuError(null);
      }
    } catch {
      if (version === loadVersion.current) setMenuError('No pudimos actualizar tu carta. Probá de nuevo antes de seguir editando.');
    } finally {
      if (version === loadVersion.current) setMenuLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadMenu();
    return () => { loadVersion.current += 1; };
  }, [loadMenu]);

  const afterMenuChange = useCallback(async () => {
    await loadMenu();
    void fetchActivation();
  }, [loadMenu, fetchActivation]);

  const newOrders = orders.filter((order) => order.status === OrderStatus.NEW);
  const activeOrders = orders.filter((order) => [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERING].includes(order.status));
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString());
  const soldToday = todayOrders.filter((order) => order.status !== OrderStatus.CANCELLED).reduce((total, order) => total + order.total, 0);
  const recentOrders = orders.filter((order) => !order.redacted).slice(0, 6);
  const currency = restaurant?.currency ?? 'ARS';
  const date = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

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

  return <div className="space-y-5 sm:space-y-6">
    <Suspense fallback={null}><WelcomeBanner name={restaurant?.name} /></Suspense>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold capitalize text-on-surface-variant">{date}</p><h1 className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">Tu menú, al día.</h1><p className="mt-1 text-sm text-on-surface-variant">Menos pantallas. Más tiempo para tu negocio.</p></div>
      <Link href="/menu" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-sm font-bold text-primary sm:px-3">Gestionar todo<MaterialIcon name="arrow_forward" size="sm" /></Link>
    </header>

    {newOrders.length > 0 && <Link href="/orders" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm font-bold text-on-surface"><span className="relative h-3 w-3 shrink-0"><span className="animate-ping-soft absolute inset-0 rounded-full bg-primary" /><span className="absolute inset-0 rounded-full bg-primary" /></span><span className="flex-1">{newOrders.length === 1 ? 'Un pedido está esperando tu respuesta' : `${newOrders.length} pedidos están esperando tu respuesta`}</span><span className="text-primary">Atender</span><MaterialIcon name="arrow_forward" size="sm" /></Link>}

    {slug && <ShareMenuCard />}

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <ManualMenuWorkspace data={menu} loading={menuLoading} error={menuError} onChanged={afterMenuChange} />
      <aside className="space-y-4">
        <Link href="/business/hours" className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant"><MaterialIcon name="schedule" size="md" /></span><span className="flex-1"><span className="block text-sm font-bold text-on-surface">Horarios del local</span><span className="mt-1 block text-xs text-on-surface-variant">Que tus clientes sepan cuándo pedir.</span></span><MaterialIcon name="chevron_right" size="sm" className="text-on-surface-variant" /></Link>
        {slug && <TestOrderCard slug={slug} />}
      </aside>
    </div>

    {activation && activation.summary.done < activation.summary.total && <details className="group overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4"><MaterialIcon name="tune" size="md" className="text-primary" /><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-on-surface">Terminá de configurar tu local</span><span className="mt-1 block text-xs text-on-surface-variant">{activation.summary.done} de {activation.summary.total} pasos listos. Seguí cuando quieras.</span></span><MaterialIcon name="expand_more" size="sm" className="transition-transform group-open:rotate-180" /></summary>
      <div className="border-t border-outline-variant/25 p-3"><ActivationPanel status={activation} /></div>
    </details>}

    {(todayOrders.length > 0 || activeOrders.length > 0) && <section aria-label="Pedidos de hoy" className="grid grid-cols-3 gap-2 sm:gap-4">
      {[{ label: 'Pedidos hoy', value: todayOrders.length }, { label: 'Vendido hoy', value: <Money amount={soldToday} currency={currency} /> }, { label: 'En curso', value: activeOrders.length }].map((stat) => <Link key={stat.label} href="/orders" className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-3 sm:p-5"><p className="text-xs font-semibold text-on-surface-variant">{stat.label}</p><p className="mt-2 font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface sm:text-2xl">{stat.value}</p></Link>)}
    </section>}

    <details className="group rounded-3xl border border-outline-variant/30 bg-surface-container-lowest">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4"><MaterialIcon name="receipt_long" size="md" className="text-on-surface-variant" /><span className="flex-1 text-sm font-bold text-on-surface">Pedidos y operación</span><span className="text-xs text-on-surface-variant">{activeOrders.length > 0 ? `${activeOrders.length} en curso` : 'Sin pedidos en curso'}</span><MaterialIcon name="expand_more" size="sm" className="transition-transform group-open:rotate-180" /></summary>
      <div className="space-y-4 border-t border-outline-variant/25 p-5">
        {recentOrders.length > 0 ? <RecentOrdersList orders={recentOrders} currency={currency} /> : <p className="text-sm text-on-surface-variant">Cuando recibas pedidos, los vas a encontrar acá. Mientras tanto, tu carta sigue siendo útil.</p>}
        <div className="flex flex-wrap gap-2"><Link href="/orders" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-bold text-primary">Abrir pedidos<MaterialIcon name="arrow_forward" size="sm" /></Link><button type="button" onClick={() => void openBoard('kitchen')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold"><MaterialIcon name="restaurant" size="sm" />Cocina</button><button type="button" onClick={() => void openBoard('delivery')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold"><MaterialIcon name="delivery_dining" size="sm" />Delivery</button></div>
      </div>
    </details>
    <SupportWhatsAppBanner restaurantName={restaurant?.name} />
  </div>;
}
