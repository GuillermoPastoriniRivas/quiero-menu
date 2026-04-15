'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { Order, OrderItem } from '@/types';
import { OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatCurrency, formatRelativeTime } from '@/lib/format';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.NEW]: 'Nuevo',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Listo',
};

const STATUS_ICONS: Record<string, string> = {
  [OrderStatus.NEW]: 'fiber_new',
  [OrderStatus.PREPARING]: 'skillet',
  [OrderStatus.READY]: 'check_circle',
};

const NEXT_STATUS: Record<string, OrderStatus> = {
  [OrderStatus.NEW]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY,
  [OrderStatus.READY]: OrderStatus.DELIVERED,
};

const NEXT_LABEL: Record<string, string> = {
  [OrderStatus.NEW]: 'Preparar',
  [OrderStatus.PREPARING]: 'Listo',
  [OrderStatus.READY]: 'Entregado',
};

const NEXT_ICON: Record<string, string> = {
  [OrderStatus.NEW]: 'restaurant',
  [OrderStatus.PREPARING]: 'check_circle',
  [OrderStatus.READY]: 'handshake',
};

export default function KitchenBoardPage() {
  const { code } = useParams<{ code: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOrderItems = useCallback(async (orderIds: string[], token: string) => {
    const missing = orderIds.filter((id) => !(id in orderItems));
    if (missing.length === 0) return;
    const results = await Promise.allSettled(
      missing.map(async (id) => {
        const res = await fetch(`${API_URL}/kitchen/orders/${id}`, {
          headers: { 'X-Kitchen-Token': token },
        });
        if (!res.ok) return { id, items: [] as OrderItem[] };
        const data = await res.json();
        return { id, items: data.items as OrderItem[] };
      }),
    );
    const newItems: Record<string, OrderItem[]> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') newItems[r.value.id] = r.value.items;
    }
    if (Object.keys(newItems).length > 0) {
      setOrderItems((prev) => ({ ...prev, ...newItems }));
    }
  }, [orderItems]);

  const fetchOrders = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`${API_URL}/kitchen/orders`, {
        headers: { 'X-Kitchen-Token': code },
      });
      if (!res.ok) {
        setInvalid(true);
        return;
      }
      const data = await res.json();
      const active = data.data.filter((o: Order) => [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status));
      alertNewOrders(active);
      setOrders(active);
      fetchOrderItems(active.map((o: Order) => o.id), code);
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [code, fetchOrderItems]);

  // Initialize audio and request notification permission
  useEffect(() => {
    audioRef.current = new Audio('/notification.wav');
    audioRef.current.preload = 'auto';
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Enable sound on first user interaction (browser autoplay policy)
  useEffect(() => {
    const enable = () => {
      setSoundEnabled(true);
      window.removeEventListener('click', enable);
      window.removeEventListener('touchstart', enable);
    };
    window.addEventListener('click', enable);
    window.addEventListener('touchstart', enable);
    return () => {
      window.removeEventListener('click', enable);
      window.removeEventListener('touchstart', enable);
    };
  }, []);

  const alertNewOrders = useCallback((newOrders: Order[]) => {
    const newNewOrders = newOrders.filter(
      (o) => o.status === OrderStatus.NEW && !knownOrderIds.current.has(o.id),
    );
    // Update known IDs
    knownOrderIds.current = new Set(newOrders.map((o) => o.id));

    if (newNewOrders.length === 0) return;

    // Play sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const count = newNewOrders.length;
      new Notification(count === 1 ? 'Nuevo pedido!' : `${count} pedidos nuevos!`, {
        body: newNewOrders.map((o) => `#${o.code} - ${o.customerName}`).join('\n'),
        icon: '/icon-192x192.png',
        tag: 'new-order',
      });
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!code) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [code]);

  if (loading) {
    return (
      <div className="dark flex h-screen items-center justify-center bg-surface">
        <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="dark flex h-screen flex-col items-center justify-center gap-4 bg-surface text-on-surface">
        <MaterialIcon name="error" size="xl" className="text-error" />
        <p className="text-lg font-medium">Link de cocina invalido</p>
        <p className="text-sm text-on-surface-variant">Este link no existe o fue eliminado.</p>
      </div>
    );
  }

  const columns = [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY];

  return (
    <div className="dark flex h-screen flex-col bg-surface text-on-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface-container-low">
        <div className="flex items-center gap-3">
          <MaterialIcon name="restaurant" size="lg" className="text-primary" />
          <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Cocina</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchOrders}>
          <MaterialIcon name="refresh" size="sm" className="mr-1" />
          Refrescar
        </Button>
      </header>

      {/* Kanban Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {columns.map((status) => {
          const statusOrders = orders.filter((o) => o.status === status);
          const isNew = status === OrderStatus.NEW;
          return (
            <div key={status} className="flex w-80 flex-shrink-0 flex-col">
              <div className="flex items-center gap-2 mb-3">
                <MaterialIcon name={STATUS_ICONS[status]} size="sm" className={isNew ? 'text-primary' : 'text-on-surface-variant'} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                  {STATUS_LABELS[status]}
                </h2>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container rounded-full px-2 py-0.5">
                  {statusOrders.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {statusOrders.map((order) => {
                  const items = orderItems[order.id];

                  return (
                    <div
                      key={order.id}
                      className={`bg-surface-container-high rounded-xl overflow-hidden ${isNew ? 'animate-[pulse-urgent_2s_ease-in-out_infinite]' : ''}`}
                    >
                      {/* Order header */}
                      <div className="p-4 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-base" style={{ fontFamily: 'var(--font-heading)' }}>{order.code}</span>
                          <span className="text-xs text-on-surface-variant">{formatRelativeTime(order.createdAt)}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant">{order.customerName}</p>
                        <div className="mt-2">
                          <Badge variant={order.deliveryType === 'pickup' ? 'secondary' : 'tonal'}>
                            {order.deliveryType === 'pickup' ? 'Retiro' : 'Delivery'}
                          </Badge>
                        </div>
                      </div>

                      {/* Order detail */}
                      <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/10">
                        {items && items.length > 0 ? (
                          <div className="space-y-2 pt-3">
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
                                    <p className="text-xs italic text-yellow-300 mt-0.5">{item.notes}</p>
                                  )}
                                </div>
                                <span className="text-on-surface-variant ml-2 shrink-0">{formatCurrency(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        ) : !items ? (
                          <div className="flex items-center gap-2 pt-3 text-xs text-on-surface-variant">
                            <MaterialIcon name="progress_activity" size="xs" className="animate-spin" />
                            Cargando items...
                          </div>
                        ) : null}

                        {/* Order total + delivery info */}
                        <div className="bg-surface-container rounded-lg p-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-on-surface-variant">Total</span>
                            <span className="font-bold">{formatCurrency(order.total)}</span>
                          </div>
                          {order.paymentMethod && (
                            <div className="flex justify-between text-xs text-on-surface-variant">
                              <span>Pago</span>
                              <span className="capitalize">{order.paymentMethod}</span>
                            </div>
                          )}
                          {order.customerPhone && order.customerPhone !== '***' && (
                            <div className="flex justify-between text-xs text-on-surface-variant">
                              <span>Tel</span>
                              <span>{order.customerPhone}</span>
                            </div>
                          )}
                          {order.deliveryType === 'delivery' && (order.customerAddress || order.customerLatitude) && (
                            <div className="flex justify-between text-xs text-on-surface-variant">
                              <span>Direccion</span>
                              <a
                                href={
                                  order.customerLatitude && order.customerLongitude
                                    ? `https://www.google.com/maps?q=${order.customerLatitude},${order.customerLongitude}`
                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress || '')}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-right max-w-[60%] text-primary hover:underline flex items-center gap-1"
                              >
                                {order.customerAddress || 'Ver ubicacion'}
                                <MaterialIcon name="open_in_new" size="xs" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Customer notes */}
                        {order.notes && (
                          <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-3 flex items-start gap-2">
                            <MaterialIcon name="warning" size="sm" className="text-yellow-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-200 font-medium italic">&ldquo;{order.notes}&rdquo;</p>
                          </div>
                        )}

                        {/* Action button */}
                        {NEXT_STATUS[status] && (
                          <Button className="w-full" onClick={async () => {
                            const next = NEXT_STATUS[status];
                            if (!next || !code) return;
                            await fetch(`${API_URL}/kitchen/orders/${order.id}/status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'X-Kitchen-Token': code },
                              body: JSON.stringify({ status: next }),
                            });
                            fetchOrders();
                          }}>
                            <MaterialIcon name={NEXT_ICON[status]} size="sm" className="mr-1" />
                            {NEXT_LABEL[status]}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
