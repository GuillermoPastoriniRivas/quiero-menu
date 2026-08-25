'use client';

import { MaterialIcon } from '@/components/ui/material-icon';
import type { AnalyticsOverview } from '@/types';
import { formatCurrency } from '@/lib/format';
import Link from 'next/link';

interface WeeklySalesChartProps {
  data: AnalyticsOverview | null;
  loading: boolean;
  currency?: string;
}

export function WeeklySalesChart({ data, loading, currency }: WeeklySalesChartProps) {
  const maxDailyRev = data ? Math.max(1, ...data.daily.map((d) => d.revenue)) : 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>Últimos 7 días</h3>
        <Link href="/analytics" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
          Ver análisis <MaterialIcon name="arrow_forward" size="xs" />
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-on-surface-variant">
          <MaterialIcon name="progress_activity" size="lg" className="animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          <div className="flex items-end gap-1.5 h-24">
            {data.daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end min-w-0 h-full">
                <div
                  className={`w-full rounded-t ${d.revenue > 0 ? 'bg-primary' : 'bg-surface-container-low'}`}
                  style={{ height: `${Math.max(4, (d.revenue / maxDailyRev) * 100)}%` }}
                  title={`${d.date}: ${formatCurrency(d.revenue, currency)}`}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-surface-container-low rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Ingresos</p>
              <p className="text-base font-extrabold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(data.summary.revenue, currency)}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pedidos</p>
              <p className="text-base font-extrabold text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
                {data.summary.orders}
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-on-surface-variant py-8 text-center">No se pudieron cargar los datos.</p>
      )}
    </div>
  );
}