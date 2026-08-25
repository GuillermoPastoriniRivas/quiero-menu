'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrderWithRedaction } from '@/types';
import { DeliveryType } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { waMeUrl } from '@/lib/utils';
import { NEXT_STATUS, STATUS_BADGE_VARIANT, STATUS_LABELS } from './status';

interface OrdersTableProps {
  orders: OrderWithRedaction[];
  currency?: string;
  onOpen: (order: OrderWithRedaction) => void;
  onAdvance: (order: OrderWithRedaction) => void;
}

export function OrdersTable({ orders, currency, onOpen, onAdvance }: OrdersTableProps) {
  return (
    <Card className="p-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 py-3">Pedido</TableHead>
            <TableHead className="px-4 py-3">Cliente</TableHead>
            <TableHead className="px-4 py-3">Tipo</TableHead>
            <TableHead className="px-4 py-3">Ítems</TableHead>
            <TableHead className="px-4 py-3 text-right">Total</TableHead>
            <TableHead className="px-4 py-3">Estado</TableHead>
            <TableHead className="px-4 py-3 text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const next = NEXT_STATUS[order.status];
            const itemsCount = order.items?.length;

            return (
              <TableRow
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
                className="cursor-pointer"
              >
                <TableCell className="px-4 py-3">
                  <p className="font-extrabold text-on-surface">{order.code}</p>
                  <p className="text-xs text-on-surface-variant">{formatRelativeTime(order.createdAt)}</p>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {order.redacted ? (
                    <p className="text-on-surface-variant">Pedido oculto</p>
                  ) : (
                    <>
                      <p className="font-medium">{order.customerName}</p>
                      {order.customerPhone && order.customerPhone !== '***' && (
                        <a
                          href={waMeUrl(order.customerPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.customerPhone}
                          <MaterialIcon name="open_in_new" size="xs" />
                        </a>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant="secondary">
                    <MaterialIcon name={order.deliveryType === DeliveryType.PICKUP ? 'storefront' : 'local_shipping'} size="xs" />
                    {order.deliveryType === DeliveryType.PICKUP ? 'Retiro' : 'Delivery'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {order.redacted ? (
                    <span className="text-on-surface-variant">—</span>
                  ) : itemsCount !== undefined ? (
                    <span className="text-on-surface-variant">{itemsCount} ítem{itemsCount === 1 ? '' : 's'}</span>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  {order.redacted ? (
                    <span className="text-on-surface-variant">—</span>
                  ) : (
                    <>
                      <p className="font-bold tabular-nums text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
                        {formatCurrency(order.total, currency)}
                      </p>
                      {order.paymentMethod && (
                        <p className="text-xs text-on-surface-variant capitalize">{order.paymentMethod}</p>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {next && (
                      <Button
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdvance(order);
                        }}
                      >
                        <MaterialIcon name={next.icon} size="xs" />
                        {next.label}
                      </Button>
                    )}
                    <MaterialIcon name="chevron_right" size="sm" className="text-on-surface-variant/60" />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}