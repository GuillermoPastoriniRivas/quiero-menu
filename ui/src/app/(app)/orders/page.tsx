'use client';

import { useEffect, useRef, useState } from 'react';
import { useOrderStore } from '@/stores/order.store';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatus, PlanTier } from '@/types';
import type { OrderItem, OrderWithRedaction, OrderFeedbackInfo } from '@/types';
import { OrderDetailDialog } from '@/components/orders/order-detail-dialog';
import { OrdersKpis } from '@/components/orders/orders-kpis';
import { OrdersTable } from '@/components/orders/orders-table';
import { OrdersMobileList } from '@/components/orders/orders-mobile-list';
import { AccessManagerDialog } from '@/components/orders/access-manager-dialog';
import { ACTIVE_STATUSES, isActiveStatus, NEXT_STATUS, STATUS_LABELS } from '@/components/orders/status';
import {
  subscribeStaffPush,
  unsubscribePush,
  isPushSupported,
  isPushSubscribed,
} from '@/lib/push';
import { toast } from 'sonner';

type Tab = 'all' | 'active' | OrderStatus.DELIVERED | OrderStatus.CANCELLED;
type DeliveryFilter = 'all' | 'pickup' | 'delivery';

export default function OrdersPage() {
  const {
    orders,
    meta,
    planInfo,
    isLoading,
    isLoadingMore,
    hasMore,
    fetch: fetchOrders,
    loadMore,
    updateStatus,
    getOrder,
    connectRealtime,
    disconnectRealtime,
  } = useOrderStore();
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('all');
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, boolean>>({});
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRedaction | null>(null);
  const [orderFeedback, setOrderFeedback] = useState<Record<string, OrderFeedbackInfo | null>>({});
  const [accessOpen, setAccessOpen] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
    fetchRestaurant();
    connectRealtime();
    return () => disconnectRealtime();
  }, [fetchOrders, fetchRestaurant, connectRealtime, disconnectRealtime]);

  useEffect(() => {
    (async () => {
      const supported = await isPushSupported();
      setPushSupported(supported);
      if (supported) setPushEnabled(await isPushSubscribed());
    })();
  }, []);

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (!pushEnabled) {
        const token = api.getAccessToken();
        if (!token) return;
        const ok = await subscribeStaffPush(token);
        if (!ok) {
          toast.error('No se pudo activar. Revisá los permisos del navegador.');
          return;
        }
        setPushEnabled(true);
        toast.success('Vas a recibir un aviso cuando entre un pedido');
      } else {
        await unsubscribePush();
        setPushEnabled(false);
        toast.success('Avisos de pedidos desactivados');
      }
    } catch {
      toast.error('Error al cambiar las notificaciones');
    } finally {
      setPushBusy(false);
    }
  };

  const loadItems = async (orderId: string) => {
    if (inFlight.current.has(orderId)) return;
    inFlight.current.add(orderId);
    setItemErrors((prev) => ({ ...prev, [orderId]: false }));
    try {
      const data = await getOrder(orderId);
      setOrderItems((prev) => ({ ...prev, [orderId]: data.items }));
      setOrderFeedback((prev) => ({ ...prev, [orderId]: data.feedback ?? null }));
    } catch {
      setItemErrors((prev) => ({ ...prev, [orderId]: true }));
    } finally {
      inFlight.current.delete(orderId);
    }
  };

  const openOrder = (order: OrderWithRedaction) => {
    setSelectedOrder(order);
    if (!order.redacted && order.items === undefined && !orderItems[order.id] && !itemErrors[order.id]) {
      loadItems(order.id);
    }
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus(id, status);
      toast.success(`Pedido actualizado a ${STATUS_LABELS[status]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar pedido');
    }
  };

  const openBoard = async (type: 'kitchen' | 'delivery') => {
    try {
      const tokens = await api.get<{ token: string }[]>(`/${type}/tokens`);
      if (tokens.length === 0) {
        toast.error(`No hay accesos de ${type === 'kitchen' ? 'cocina' : 'delivery'}. Creá uno en Accesos.`);
        return;
      }
      window.open(`${window.location.origin}/${type}/${tokens[0].token}`, '_blank');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al abrir el tablero');
    }
  };

  const q = search.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    if (q) {
      const haystack = `${o.code} ${o.customerName ?? ''} ${o.customerPhone ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (deliveryFilter !== 'all' && o.deliveryType !== deliveryFilter) return false;
    if (tab === 'all') return true;
    if (tab === 'active') return isActiveStatus(o.status);
    return o.status === tab;
  });

  const counts = {
    all: orders.length,
    active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
    cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
  };

  const currency = restaurant?.currency;
  const filtersActive = q !== '' || deliveryFilter !== 'all' || tab !== 'all';

  const advance = (order: OrderWithRedaction) => {
    const next = NEXT_STATUS[order.status];
    if (next) handleStatusChange(order.id, next.status);
  };

  return (
    <div className="min-w-0 w-full space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-on-surface-variant">Operá tus pedidos en tiempo real, desde que llegan hasta que se entregan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => openBoard('kitchen')}>
            <MaterialIcon name="restaurant" size="sm" className="mr-1" />Cocina
          </Button>
          <Button variant="outline" size="sm" onClick={() => openBoard('delivery')}>
            <MaterialIcon name="delivery_dining" size="sm" className="mr-1" />Delivery
          </Button>
          {pushSupported && (
            <Button
              variant={pushEnabled ? 'default' : 'outline'}
              size="sm"
              disabled={pushBusy}
              onClick={handleTogglePush}
              title={
                pushEnabled
                  ? 'Avisos activados: te enterás al instante cuando entra un pedido'
                  : 'Activar avisos cuando entre un pedido nuevo'
              }
            >
              <MaterialIcon
                name={pushEnabled ? 'notifications_active' : 'notifications_off'}
                size="sm"
                className="mr-1"
                fill={pushEnabled}
              />
              Avisos
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setAccessOpen(true)} title="Accesos del equipo">
            <MaterialIcon name="key" size="sm" className="mr-1" />Accesos
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <OrdersKpis orders={orders} currency={currency} />

      {/* Upgrade banner */}
      {planInfo && planInfo.redactedCount > 0 && planInfo.plan === PlanTier.FREE && (
        <Card size="sm" className="flex-row items-center gap-3 border border-primary/20 bg-primary/5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MaterialIcon name="lock" size="sm" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-on-surface">Tenes {planInfo.redactedCount} pedidos ocultos</p>
            <p className="text-xs text-on-surface-variant">Subi a Pro para ver todos tus pedidos sin limite.</p>
          </div>
          <Button size="sm" onClick={() => (window.location.href = '/billing')}>
            <MaterialIcon name="bolt" size="sm" />Subir a Pro
          </Button>
        </Card>
      )}

      {/* Tabs - scroll horizontal en mobile sin desalinear el layout */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full overflow-x-auto scrollbar-none">
        <TabsList className="w-max max-w-none">
          <TabsTrigger value="all">
            Todos
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">{counts.all}</span>
          </TabsTrigger>
          <TabsTrigger value="active">
            Activos
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">{counts.active}</span>
          </TabsTrigger>
          <TabsTrigger value={OrderStatus.DELIVERED}>
            Entregados
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">{counts.delivered}</span>
          </TabsTrigger>
          <TabsTrigger value={OrderStatus.CANCELLED}>
            Cancelados
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">{counts.cancelled}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <MaterialIcon name="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, cliente o teléfono"
            className="w-full pl-9 md:max-w-sm"
          />
        </div>
        <Select
          value={deliveryFilter}
          onValueChange={(v) => setDeliveryFilter((v as DeliveryFilter) ?? 'all')}
        >
          <SelectTrigger size="sm" className="w-full md:w-auto">
            <MaterialIcon
              name={deliveryFilter === 'all' ? 'swap_vert' : deliveryFilter === 'pickup' ? 'storefront' : 'local_shipping'}
              size="sm"
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="pickup">Retiro</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result summary */}
      {orders.length > 0 && (
        <p className="text-sm text-on-surface-variant">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
          {filtersActive && ' (filtrados)'}
        </p>
      )}

      {/* Loading skeleton */}
      {isLoading && orders.length === 0 ? (
        <Card className="p-0">
          <div className="space-y-0 divide-y divide-outline-variant/10 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-28" />
              </div>
            ))}
          </div>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-variant">
              <MaterialIcon name="receipt_long" size="lg" />
            </span>
            <div>
              <p className="font-bold text-on-surface">Todavía no hay pedidos</p>
              <p className="text-sm text-on-surface-variant">Cuando alguien pida por tu menú, el pedido aparece acá en tiempo real.</p>
            </div>
          </div>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-variant">
              <MaterialIcon name="search_off" size="lg" />
            </span>
            <div>
              <p className="font-bold text-on-surface">No se encontraron pedidos</p>
              <p className="text-sm text-on-surface-variant">Probá ajustar la búsqueda o los filtros.</p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <OrdersTable
              orders={filteredOrders}
              currency={currency}
              onOpen={openOrder}
              onAdvance={advance}
            />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            <OrdersMobileList
              orders={filteredOrders}
              currency={currency}
              onOpen={openOrder}
              onAdvance={advance}
            />
          </div>

          {/* Load more */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <p className="text-xs text-on-surface-variant">
              Mostrando {orders.length} de {meta?.total ?? orders.length} pedidos
            </p>
            {hasMore && (
              <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? (
                  <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                ) : (
                  <MaterialIcon name="expand_more" size="sm" />
                )}
                Cargar más
              </Button>
            )}
          </div>
        </>
      )}

      {/* Detail dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        items={selectedOrder ? (selectedOrder.items ?? orderItems[selectedOrder.id]) : undefined}
        itemsError={selectedOrder ? !!itemErrors[selectedOrder.id] : false}
        feedback={selectedOrder ? (orderFeedback[selectedOrder.id] ?? null) : null}
        restaurant={restaurant}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onRetryItems={() => selectedOrder && loadItems(selectedOrder.id)}
        onStatusChange={handleStatusChange}
      />

      {/* Team access dialog */}
      <AccessManagerDialog open={accessOpen} onOpenChange={setAccessOpen} />
    </div>
  );
}