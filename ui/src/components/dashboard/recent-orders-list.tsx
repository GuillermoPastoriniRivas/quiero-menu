'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import { OrderStatus } from '@/types';
import type { OrderWithRedaction } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import Link from 'next/link';

export const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.NEW]: 'Nuevo',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Listo',
  [OrderStatus.DELIVERING]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

const STATUS_BADGE_VARIANT: Record<string, NonNullable<React.ComponentProps<typeof Badge>['variant']>> = {
  [OrderStatus.NEW]: 'nuevo',
  [OrderStatus.PREPARING]: 'preparando',
  [OrderStatus.READY]: 'listo',
  [OrderStatus.DELIVERING]: 'tonal',
  [OrderStatus.DELIVERED]: 'secondary',
  [OrderStatus.CANCELLED]: 'destructive',
};

export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: string }>> = {
  [OrderStatus.NEW]: { status: OrderStatus.PREPARING, label: 'Aceptar', icon: 'restaurant' },
  [OrderStatus.PREPARING]: { status: OrderStatus.READY, label: 'Listo', icon: 'check_circle' },
  [OrderStatus.READY]: { status: OrderStatus.DELIVERED, label: 'Entregar', icon: 'handshake' },
};

interface RecentOrdersListProps {
  orders: OrderWithRedaction[];
  currency?: string;
  /** Si no se pasa, la lista es solo-lectura (la operacion vive en Pedidos) */
  onAdvance?: (order: OrderWithRedaction) => void;
}

export function RecentOrdersList({ orders, currency, onAdvance }: RecentOrdersListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>Pedidos recientes</h3>
        <Link href="/orders" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
          Ver todos <MaterialIcon name="arrow_forward" size="xs" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-4">No hay pedidos para mostrar.</p>
      ) : (
        <div className="divide-y divide-outline-variant/10">
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            return (
              <div key={order.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-on-surface">{order.code}</span>
                    <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                    {order.customerName} · {formatRelativeTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
                    {formatCurrency(order.total, currency)}
                  </p>
                  {next && onAdvance && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="mt-1"
                      onClick={() => onAdvance(order)}
                    >
                      <MaterialIcon name={next.icon} size="xs" />
                      {next.label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}