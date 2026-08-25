'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { OrderWithRedaction } from '@/types';
import { DeliveryType, OrderStatus } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { waMeUrl } from '@/lib/utils';
import { NEXT_STATUS, STATUS_BADGE_VARIANT, STATUS_LABELS } from './status';

interface OrdersMobileListProps {
  orders: OrderWithRedaction[];
  currency?: string;
  onOpen: (order: OrderWithRedaction) => void;
  onAdvance: (order: OrderWithRedaction) => void;
}

export function OrdersMobileList({ orders, currency, onOpen, onAdvance }: OrdersMobileListProps) {
  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const next = NEXT_STATUS[order.status];
        const isNew = order.status === OrderStatus.NEW;

        return (
          <div
            key={order.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(order)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(order);
              }
            }}
            className={`relative rounded-2xl bg-card p-4 shadow-ambient transition-colors hover:bg-muted/50 cursor-pointer ${order.redacted ? 'opacity-60' : ''}`}
          >
            {isNew && <div className="absolute top-0 left-0 h-full w-1.5 rounded-l-2xl bg-primary" />}

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`font-extrabold text-lg ${isNew ? 'text-primary' : 'text-on-surface'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                  {order.code}
                </p>
                <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                  {order.redacted ? (
                    <span className="inline-flex items-center gap-1">
                      <MaterialIcon name="lock" size="xs" /> Pedido oculto
                    </span>
                  ) : (
                    <>
                      {order.customerName} · {formatRelativeTime(order.createdAt)}
                    </>
                  )}
                </p>
              </div>
              <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>

            {!order.redacted && (
              <>
                <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                  <Badge variant="secondary">
                    <MaterialIcon name={order.deliveryType === DeliveryType.PICKUP ? 'storefront' : 'local_shipping'} size="xs" />
                    {order.deliveryType === DeliveryType.PICKUP ? 'Retiro' : 'Delivery'}
                  </Badge>
                  {order.deliveryType === DeliveryType.DELIVERY && order.customerPhone !== '***' && (
                    <a
                      href={waMeUrl(order.customerPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MaterialIcon name="chat" size="xs" />
                      WhatsApp
                    </a>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-outline-variant/10 pt-3">
                  <p className="font-bold tabular-nums text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
                    {formatCurrency(order.total, currency)}
                    {order.paymentMethod && (
                      <span className="ml-2 text-xs font-medium text-on-surface-variant capitalize">{order.paymentMethod}</span>
                    )}
                  </p>
                  {next && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdvance(order);
                      }}
                    >
                      <MaterialIcon name={next.icon} size="sm" />
                      {next.label}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}