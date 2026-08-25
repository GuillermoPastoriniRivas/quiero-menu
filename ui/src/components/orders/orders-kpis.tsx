'use client';

import { Card } from '@/components/ui/card';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { OrderWithRedaction } from '@/types';
import { OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/format';
import { isActiveStatus } from './status';

function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

interface OrdersKpisProps {
  orders: OrderWithRedaction[];
  currency?: string;
}

export function OrdersKpis({ orders, currency }: OrdersKpisProps) {
  const today = new Date();

  const active = orders.filter((o) => !o.redacted && isActiveStatus(o.status)).length;

  const todayOrders = orders.filter((o) => !o.redacted && isSameDay(o.createdAt, today));
  const todayValid = todayOrders.filter((o) => o.status !== OrderStatus.CANCELLED);
  const revenueToday = todayValid.reduce((sum, o) => sum + o.total, 0);
  const avgTicket = todayValid.length > 0 ? revenueToday / todayValid.length : 0;

  const kpis = [
    { label: 'Activos', value: String(active), icon: 'rocket_launch', tone: 'text-primary bg-primary/10' },
    { label: 'Pedidos hoy', value: String(todayOrders.length), icon: 'receipt_long', tone: 'text-tertiary bg-tertiary/10' },
    { label: 'Ingresos hoy', value: formatCurrency(revenueToday, currency), icon: 'payments', tone: 'text-success bg-success/10' },
    { label: 'Ticket promedio', value: formatCurrency(avgTicket, currency), icon: 'query_stats', tone: 'text-on-surface-variant bg-surface-container-low' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} size="sm" className="gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{kpi.label}</p>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${kpi.tone}`}>
              <MaterialIcon name={kpi.icon} size="sm" />
            </span>
          </div>
          <p className="text-xl font-extrabold tabular-nums text-on-surface md:text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {kpi.value}
          </p>
        </Card>
      ))}
    </div>
  );
}