'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOrderStore } from '@/stores/order.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaterialIcon } from '@/components/ui/material-icon';
import { OrderStatus, PlanTier } from '@/types';
import type { OrderItem, OrderWithRedaction } from '@/types';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/format';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.DRAFT]: 'Borrador',
  [OrderStatus.NEW]: 'Nuevo',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Listo',
  [OrderStatus.DELIVERING]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

const STATUS_BADGE_VARIANT: Record<string, string> = {
  [OrderStatus.DRAFT]: 'secondary',
  [OrderStatus.NEW]: 'nuevo',
  [OrderStatus.PREPARING]: 'preparando',
  [OrderStatus.READY]: 'listo',
  [OrderStatus.DELIVERING]: 'tonal',
  [OrderStatus.DELIVERED]: 'secondary',
  [OrderStatus.CANCELLED]: 'destructive',
};

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: string }>> = {
  [OrderStatus.DRAFT]: { status: OrderStatus.NEW, label: 'Confirmar', icon: 'check' },
  [OrderStatus.NEW]: { status: OrderStatus.PREPARING, label: 'Aceptar y Preparar', icon: 'restaurant' },
  [OrderStatus.PREPARING]: { status: OrderStatus.READY, label: 'Marcar como Listo', icon: 'check_circle' },
  [OrderStatus.READY]: { status: OrderStatus.DELIVERED, label: 'Marcar como Entregado', icon: 'handshake' },
};

export default function OrdersPage() {
  const { orders, planInfo, fetch: fetchOrders, updateStatus, getOrder, connectRealtime, disconnectRealtime } = useOrderStore();
  const [tab, setTab] = useState('all');
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

  const fetchAllItems = useCallback(async (orderList: OrderWithRedaction[]) => {
    const toFetch = orderList.filter((o) => !('redacted' in o && o.redacted) && !orderItems[o.id]);
    if (toFetch.length === 0) return;
    const results = await Promise.allSettled(
      toFetch.map(async (o) => {
        const data = await getOrder(o.id);
        return { id: o.id, items: data.items };
      }),
    );
    const newItems: Record<string, OrderItem[]> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') newItems[r.value.id] = r.value.items;
    }
    if (Object.keys(newItems).length > 0) {
      setOrderItems((prev) => ({ ...prev, ...newItems }));
    }
  }, [orderItems, getOrder]);

  useEffect(() => {
    fetchOrders();
    connectRealtime();
    return () => disconnectRealtime();
  }, []);

  useEffect(() => {
    if (orders.length > 0) fetchAllItems(orders);
  }, [orders]);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus(id, status);
      toast.success(`Pedido actualizado a ${STATUS_LABELS[status]}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredOrders = tab === 'all'
    ? orders
    : tab === 'active'
    ? orders.filter((o) => [OrderStatus.DRAFT, OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERING].includes(o.status))
    : orders.filter((o) => o.status === tab);

  const activeCount = orders.filter((o) => [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status)).length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/10">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Activos</p>
          <p className="text-2xl font-extrabold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/10">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Hoy</p>
          <p className="text-2xl font-extrabold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>{orders.length}</p>
        </div>
      </section>

      <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Gestion de Pedidos</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value={OrderStatus.DRAFT}>Borradores</TabsTrigger>
          <TabsTrigger value={OrderStatus.DELIVERED}>Entregados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Upgrade banner */}
      {planInfo && planInfo.redactedCount > 0 && planInfo.plan === PlanTier.FREE && (
        <div className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-200/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MaterialIcon name="lock" size="md" className="text-yellow-600" />
            <div>
              <p className="font-medium">Tenes {planInfo.redactedCount} pedidos ocultos</p>
              <p className="text-sm text-on-surface-variant">Subi a Pro para ver todos tus pedidos sin limite.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => window.location.href = '/settings?tab=billing'}>
            <MaterialIcon name="bolt" size="sm" className="mr-1" />Subir a Pro
          </Button>
        </div>
      )}

      {/* Order Cards */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isRedacted = 'redacted' in order && (order as OrderWithRedaction).redacted;
          const isNew = order.status === OrderStatus.NEW;
          const nextAction = NEXT_STATUS[order.status];
          const items = orderItems[order.id];

          return (
            <div
              key={order.id}
              className={`bg-white rounded-xl shadow-sm border border-outline-variant/10 relative overflow-hidden transition-all hover:shadow-ambient ${isRedacted ? 'opacity-60' : ''}`}
            >
              {/* Color bar for new orders */}
              {isNew && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />}

              {/* Header */}
              <div className="p-5 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`font-extrabold text-xl ${isNew ? 'text-primary' : 'text-on-surface'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                      {order.code}
                    </span>
                    {isRedacted ? (
                      <p className="text-xs text-on-surface-variant font-medium mt-1 flex items-center gap-1">
                        <MaterialIcon name="lock" size="xs" /> Pedido oculto
                      </p>
                    ) : (
                      <p className="text-xs text-on-surface-variant font-medium mt-1">
                        {formatRelativeTime(order.createdAt)} &bull; {order.customerName}
                        {order.customerPhone && <> &bull; {order.customerPhone}</>}
                      </p>
                    )}
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[order.status] as any}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </div>

                {/* Delivery type + address */}
                {!isRedacted && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
                    <Badge variant="secondary" className="text-[10px]">
                      {order.deliveryType === 'pickup' ? 'Retiro' : 'Delivery'}
                    </Badge>
                    {order.deliveryType === 'delivery' && (order.customerAddress || order.customerLatitude) && (
                      <a
                        href={
                          order.customerLatitude && order.customerLongitude
                            ? `https://www.google.com/maps?q=${order.customerLatitude},${order.customerLongitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress || '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MaterialIcon name="location_on" size="xs" />
                        {order.customerAddress || 'Ver ubicacion'}
                        <MaterialIcon name="open_in_new" size="xs" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Detail — always visible for non-redacted */}
              {!isRedacted && (
                <div className="px-5 pb-5 space-y-3">
                  {/* Items */}
                  {items && items.length > 0 ? (
                    <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <span className="font-semibold">{item.quantity}x {item.menuItemName}</span>
                            {item.variantName && (
                              <span className="text-on-surface-variant"> ({item.variantName})</span>
                            )}
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <p className="text-xs text-on-surface-variant mt-0.5">
                                {item.selectedOptions.map((o) => o.name).join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-xs italic text-on-surface-variant mt-0.5">{item.notes}</p>
                            )}
                          </div>
                          <span className="text-on-surface-variant ml-2 shrink-0">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  ) : !items ? (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <MaterialIcon name="progress_activity" size="xs" className="animate-spin" />
                      Cargando items...
                    </div>
                  ) : null}

                  {/* Notes */}
                  {order.notes && (
                    <div className="bg-yellow-100 border border-yellow-200 p-3 rounded-xl flex items-start gap-2">
                      <MaterialIcon name="warning" size="sm" className="text-yellow-700 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-900 font-bold italic">&ldquo;{order.notes}&rdquo;</p>
                    </div>
                  )}

                  {/* Total + action */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="font-bold text-lg text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>{formatCurrency(order.total)}</span>
                      {order.paymentMethod && (
                        <span className="text-xs text-on-surface-variant ml-2 capitalize">{order.paymentMethod}</span>
                      )}
                    </div>
                    {nextAction && (
                      <Button
                        onClick={() => handleStatusChange(order.id, nextAction.status)}
                        className="shadow-md shadow-primary/20"
                      >
                        <MaterialIcon name={nextAction.icon} size="sm" />
                        {nextAction.label}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <p className="text-center text-on-surface-variant py-8">No hay pedidos.</p>
        )}
      </div>
    </div>
  );
}
