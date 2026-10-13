'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import type { Order, OrderItem } from '@/types';
import { OrderStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatCurrency } from '@/lib/format';
import { waMeUrl } from '@/lib/utils';
import { browserPathParam } from '@/lib/static-route-param';

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015/api') + '/v1';

export interface BoardStatusMeta {
  label: string;
  icon: string;
  empty: string;
  next?: { status: OrderStatus; label: string; icon: string };
}

export interface BoardConfig {
  title: string;
  headerIcon: string;
  /** Header HTTP con el token del tablero (ej. X-Kitchen-Token). */
  tokenHeader: string;
  /** Prefijo de la API (ej. /kitchen). */
  apiBase: string;
  /** Etiqueta del tablero cuando no hay token válido. */
  invalidLabel: string;
  statuses: OrderStatus[];
  meta: Record<string, BoardStatusMeta>;
  /** Estado que dispara el aviso de pedido nuevo. */
  alertOn: OrderStatus;
  /** Carta de cocina (platos) o de reparto (dirección/teléfono primero). */
  variant: 'kitchen' | 'delivery';
}

type BoardOrder = Order & { items?: OrderItem[] };

/** Cuánto lleva esperando: neutro, ámbar (12′) o rojo (25′). */
function elapsedTone(createdAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  const text = minutes < 1 ? 'ahora' : `${minutes}′`;
  if (minutes >= 25) return { text, chip: 'bg-error-container text-on-error-container', border: 'border-error' };
  if (minutes >= 12) return { text, chip: 'bg-amber-500/20 text-amber-300', border: 'border-amber-400' };
  return { text, chip: 'bg-surface-container text-on-surface-variant', border: 'border-outline-variant/40' };
}

function mapsUrl(order: BoardOrder): string {
  if (order.customerLatitude && order.customerLongitude) {
    return `https://www.google.com/maps?q=${order.customerLatitude},${order.customerLongitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress || '')}`;
}

function ItemsList({ items }: { items?: OrderItem[] }) {
  if (!items) {
    return (
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
        Cargando platos…
      </div>
    );
  }
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <span className="w-9 shrink-0 text-xl font-extrabold leading-tight text-primary">{item.quantity}×</span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-snug text-on-surface">{item.menuItemName}</p>
            {item.variantName && <p className="text-sm text-on-surface-variant">{item.variantName}</p>}
            {item.selectedOptions && item.selectedOptions.length > 0 && (
              <p className="text-sm text-on-surface-variant">{item.selectedOptions.map((o) => o.name).join(', ')}</p>
            )}
            {item.notes && <p className="text-base font-semibold italic text-amber-300">“{item.notes}”</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, items, config, onAdvance }: {
  order: BoardOrder;
  items?: OrderItem[];
  config: BoardConfig;
  onAdvance: (status: OrderStatus) => void;
}) {
  const tone = elapsedTone(order.createdAt);
  const next = config.meta[order.status]?.next;
  const hasPhone = Boolean(order.customerPhone && order.customerPhone !== '***');
  const hasAddress = Boolean(order.customerAddress || order.customerLatitude);

  return (
    <article className={`overflow-hidden rounded-2xl border-l-4 bg-surface-container-high ${tone.border}`}>
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-none tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            {order.code}
          </p>
          <p className="mt-1.5 truncate text-base text-on-surface-variant">{order.customerName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${tone.chip}`}>{tone.text}</span>
          {config.variant === 'kitchen' && order.deliveryType && (
            <Badge variant={order.deliveryType === 'pickup' ? 'secondary' : 'tonal'}>
              {order.deliveryType === 'pickup' ? 'Retiro' : 'Delivery'}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 pb-3">
        {config.variant === 'delivery' && (hasAddress || hasPhone) && (
          <div className="space-y-2">
            {hasAddress && (
              <a
                href={mapsUrl(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-surface-container p-3 text-base font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <MaterialIcon name="location_on" size="md" className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1">{order.customerAddress || 'Ver ubicación en el mapa'}</span>
                <MaterialIcon name="open_in_new" size="sm" className="shrink-0 text-primary" />
              </a>
            )}
            {hasPhone && (
              <a
                href={waMeUrl(order.customerPhone!)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-surface-container p-3 text-base font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <MaterialIcon name="chat" size="md" className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1">{order.customerPhone}</span>
                <MaterialIcon name="open_in_new" size="sm" className="shrink-0 text-primary" />
              </a>
            )}
          </div>
        )}

        <ItemsList items={items} />

        {order.notes && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <MaterialIcon name="warning" size="sm" className="mt-0.5 shrink-0 text-amber-300" />
            <p className="text-base font-semibold italic text-amber-100">“{order.notes}”</p>
          </div>
        )}

        {config.variant === 'kitchen' && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
            <span className="font-semibold">{formatCurrency(order.total, order.currency ?? 'ARS')}</span>
            {hasPhone && (
              <a href={waMeUrl(order.customerPhone!)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {order.customerPhone}
              </a>
            )}
            {order.deliveryType === 'delivery' && hasAddress && (
              <a href={mapsUrl(order)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                Ver dirección
                <MaterialIcon name="open_in_new" size="xs" />
              </a>
            )}
          </div>
        )}

        {config.variant === 'delivery' && (
          <p className="text-sm text-on-surface-variant">
            Total <span className="font-semibold text-on-surface">{formatCurrency(order.total, order.currency ?? 'ARS')}</span>
          </p>
        )}
      </div>

      {next && (
        <div className="p-3 pt-0">
          <button
            type="button"
            onClick={() => onAdvance(next.status)}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-base font-bold text-primary-foreground shadow-md shadow-primary/20 transition-transform active:scale-[0.99]"
          >
            <MaterialIcon name={next.icon} size="md" />
            {next.label}
          </button>
        </div>
      )}
    </article>
  );
}

export function OrderBoard({ config }: { config: BoardConfig }) {
  const params = useParams<{ code: string }>();
  const pathname = usePathname();
  const code = browserPathParam(pathname, params.code);
  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tab, setTab] = useState<OrderStatus>(config.statuses[0]);
  const [flashNew, setFlashNew] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const initialTab = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOrderItems = useCallback(async (list: BoardOrder[], token: string) => {
    const missing = list
      .filter((o) => !(o.items && o.items.length > 0))
      .map((o) => o.id)
      .filter((id) => !(id in orderItems));
    if (missing.length === 0) return;
    const results = await Promise.allSettled(
      missing.map(async (id) => {
        const res = await fetch(`${API_URL}${config.apiBase}/orders/${id}`, {
          headers: { [config.tokenHeader]: token },
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
    if (Object.keys(newItems).length > 0) setOrderItems((prev) => ({ ...prev, ...newItems }));
  }, [config.apiBase, config.tokenHeader, orderItems]);

  const alertNewOrders = useCallback((incoming: BoardOrder[]) => {
    const newOnes = incoming.filter(
      (o) => o.status === config.alertOn && !knownOrderIds.current.has(o.id),
    );
    knownOrderIds.current = new Set(incoming.map((o) => o.id));
    if (newOnes.length === 0) return;

    setFlashNew(true);
    window.setTimeout(() => setFlashNew(false), 4000);
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      const count = newOnes.length;
      new Notification(count === 1 ? 'Nuevo pedido' : `${count} pedidos nuevos`, {
        body: newOnes.map((o) => `${o.code} · ${o.customerName}`).join('\n'),
        icon: '/icon.svg',
        tag: `board-${config.apiBase}`,
      });
    }
  }, [config.alertOn, config.apiBase, soundEnabled]);

  const fetchOrders = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`${API_URL}${config.apiBase}/orders`, {
        headers: { [config.tokenHeader]: code },
      });
      if (!res.ok) {
        setInvalid(true);
        return;
      }
      const data = await res.json();
      const active = data.data.filter((o: Order) => config.statuses.includes(o.status));
      alertNewOrders(active);
      setOrders(active);
      fetchOrderItems(active, code);
      if (!initialTab.current) {
        initialTab.current = true;
        const firstWithOrders = config.statuses.find((status) => active.some((o: Order) => o.status === status));
        if (firstWithOrders) setTab(firstWithOrders);
      }
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [code, config.statuses, config.apiBase, config.tokenHeader, alertNewOrders, fetchOrderItems]);

  const advance = useCallback(async (orderId: string, status: OrderStatus) => {
    if (!code) return;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    await fetch(`${API_URL}${config.apiBase}/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [config.tokenHeader]: code },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    fetchOrders();
  }, [code, config.apiBase, config.tokenHeader, fetchOrders]);

  useEffect(() => {
    audioRef.current = new Audio('/notification.wav');
    audioRef.current.preload = 'auto';
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  useEffect(() => {
    if (!code) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [code, fetchOrders]);

  if (loading) {
    return (
      <div className="dark flex h-[100dvh] items-center justify-center bg-surface">
        <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="dark flex h-[100dvh] flex-col items-center justify-center gap-4 bg-surface px-6 text-center text-on-surface">
        <MaterialIcon name="error" size="xl" className="text-error" />
        <p className="text-lg font-medium">Link de {config.invalidLabel} inválido</p>
        <p className="text-sm text-on-surface-variant">Este link no existe o fue eliminado.</p>
      </div>
    );
  }

  const countFor = (status: OrderStatus) => orders.filter((o) => o.status === status).length;
  const alertCount = countFor(config.alertOn);
  const itemsFor = (order: BoardOrder) => order.items ?? orderItems[order.id];

  return (
    <div className="dark relative flex h-[100dvh] flex-col bg-surface text-on-surface">
      <header className="flex items-center justify-between gap-3 bg-surface-container-low px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <MaterialIcon name={config.headerIcon} size="lg" className="text-primary" />
          <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{config.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold sm:inline-flex ${
              soundEnabled ? 'bg-success-container text-success' : 'bg-surface-container text-on-surface-variant'
            }`}
            title={soundEnabled ? 'Los avisos suenan' : 'Tocá una vez para activar el sonido'}
          >
            <MaterialIcon name={soundEnabled ? 'notifications_active' : 'notifications_off'} size="xs" />
            {soundEnabled ? 'Aviso sonoro' : 'Tocá para activar sonido'}
          </span>
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <MaterialIcon name="refresh" size="sm" />
            Refrescar
          </button>
        </div>
      </header>

      {/* Tabs (mobile / tablet vertical): una sola columna, sin scroll horizontal */}
      <nav className="flex gap-2 border-b border-outline-variant/20 bg-surface-container-low/60 p-2 lg:hidden" aria-label="Estados de pedido">
        {config.statuses.map((status) => {
          const active = tab === status;
          const count = countFor(status);
          const highlight = status === config.alertOn && alertCount > 0 && !active;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setTab(status)}
              aria-pressed={active}
              className={`flex min-h-14 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-bold transition-colors ${
                active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-surface-container text-on-surface-variant'
              } ${highlight ? 'animate-[pulse-urgent_2s_ease-in-out_infinite]' : ''}`}
            >
              <MaterialIcon name={config.meta[status].icon} size="sm" />
              <span className="min-w-0 truncate">{config.meta[status].label}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${active ? 'bg-primary-foreground/15' : 'bg-surface-container-high'}`}>{count}</span>
            </button>
          );
        })}
      </nav>

      {/* Contenido mobile: la columna elegida, a pantalla completa */}
      <div className="flex-1 overflow-y-auto p-3 lg:hidden">
        <div className="space-y-3">
          {orders.filter((o) => o.status === tab).map((order) => (
            <OrderCard key={order.id} order={order} items={itemsFor(order)} config={config} onAdvance={(status) => advance(order.id, status)} />
          ))}
          {orders.filter((o) => o.status === tab).length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center text-on-surface-variant">
              <MaterialIcon name={config.meta[tab].icon} size="xl" className="opacity-40" />
              <p className="text-base font-semibold">{config.meta[tab].empty}</p>
              {tab !== config.alertOn && alertCount > 0 && (
                <button type="button" onClick={() => setTab(config.alertOn)} className="mt-1 text-sm font-bold text-primary">
                  Ver {alertCount === 1 ? 'el nuevo' : `los ${alertCount} nuevos`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contenido escritorio / tablet horizontal: columnas lado a lado */}
      <div className="hidden flex-1 gap-4 overflow-x-auto p-4 lg:flex">
        {config.statuses.map((status) => {
          const statusOrders = orders.filter((o) => o.status === status);
          const isAlert = status === config.alertOn;
          return (
            <section key={status} className="flex min-w-80 flex-1 flex-col">
              <div className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 ${isAlert && alertCount > 0 ? 'bg-primary/10' : ''}`}>
                <MaterialIcon name={config.meta[status].icon} size="sm" className={isAlert ? 'text-primary' : 'text-on-surface-variant'} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">{config.meta[status].label}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isAlert && alertCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-on-surface-variant'}`}>
                  {statusOrders.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pb-2">
                {statusOrders.map((order) => (
                  <OrderCard key={order.id} order={order} items={itemsFor(order)} config={config} onAdvance={(next) => advance(order.id, next)} />
                ))}
                {statusOrders.length === 0 && (
                  <p className="rounded-xl border border-dashed border-outline-variant/30 py-8 text-center text-sm text-on-surface-variant">
                    {config.meta[status].empty}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Aviso de pedidos nuevos (mobile, cuando no estás en esa columna) */}
      {flashNew && tab !== config.alertOn && (
        <button
          type="button"
          onClick={() => setTab(config.alertOn)}
          className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-2xl bg-primary p-4 text-left text-primary-foreground shadow-ambient-lg lg:hidden"
        >
          <MaterialIcon name="notifications_active" size="lg" />
          <span className="flex-1 text-sm font-bold">
            {alertCount === 1 ? 'Llegó un pedido nuevo' : `Llegaron ${alertCount} pedidos nuevos`}
          </span>
          <MaterialIcon name="arrow_forward" size="sm" />
        </button>
      )}
    </div>
  );
}
