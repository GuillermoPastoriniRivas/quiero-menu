'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { AnalyticsOverview } from '@/types';
import { OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/format';

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.NEW]: 'Nuevos',
  [OrderStatus.PREPARING]: 'En preparación',
  [OrderStatus.READY]: 'Listos',
  [OrderStatus.DELIVERING]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregados',
  [OrderStatus.CANCELLED]: 'Cancelados',
};

export default function AnalyticsPage() {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);
  const [range, setRange] = useState<'7' | '30'>('7');
  const [result, setResult] = useState<{
    range: '7' | '30';
    data: AnalyticsOverview | null;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AnalyticsOverview>(`/analytics/overview?range=${range}`)
      .then((d) => {
        if (!cancelled) setResult({ range, data: d, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ range, data: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const current = result && result.range === range ? result : null;
  const data = current?.data ?? null;
  const loading = !current;
  const error = current?.error ?? false;

  const currency = restaurant?.currency || 'ARS';

  const maxDaily = data ? Math.max(1, ...data.daily.map((d) => d.revenue)) : 1;
  const maxHour = data ? Math.max(1, ...data.byHour.map((h) => h.orders)) : 1;

  const deltaBadge = (delta: number) => {
    const up = delta >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? 'text-green-700' : 'text-red-600'}`}>
        <MaterialIcon name={up ? 'arrow_upward' : 'arrow_downward'} size="xs" />
        {Math.abs(Math.round(delta))}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Análisis de ventas</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={range === '7' ? 'default' : 'outline'}
            onClick={() => setRange('7')}
          >
            Últimos 7 días
          </Button>
          <Button
            size="sm"
            variant={range === '30' ? 'default' : 'outline'}
            onClick={() => setRange('30')}
          >
            Últimos 30 días
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
        </div>
      ) : error || !data ? (
        <p className="text-center text-on-surface-variant py-16">No se pudieron cargar los datos.</p>
      ) : (
        <>
          {/* Summary cards */}
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card size="sm" className="shadow-sm border border-outline-variant/10">
              <CardContent className="px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ingresos</p>
                <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>{formatCurrency(data.summary.revenue, currency)}</p>
                {deltaBadge(data.deltas.revenue)}
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm border border-outline-variant/10">
              <CardContent className="px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pedidos</p>
                <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>{data.summary.orders}</p>
                {deltaBadge(data.deltas.orders)}
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm border border-outline-variant/10">
              <CardContent className="px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Ticket promedio</p>
                <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>{formatCurrency(data.summary.avgTicket, currency)}</p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm border border-outline-variant/10">
              <CardContent className="px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Conversión</p>
                <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>{data.summary.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-on-surface-variant">{data.summary.views} vistas al menú</p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm border border-outline-variant/10">
              <CardContent className="px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cancelados</p>
                <p className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>{data.summary.cancelled}</p>
                <p className="text-xs text-on-surface-variant">{data.summary.cancelledRate.toFixed(1)}% del total</p>
              </CardContent>
            </Card>
          </section>

          {/* Daily sales */}
          <Card>
            <CardHeader>
              <CardTitle>Ventas por día</CardTitle>
              <CardDescription>Ingresos diarios del período</CardDescription>
            </CardHeader>
            <CardContent>
              {data.daily.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-6 text-center">Sin ventas en este período.</p>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {data.daily.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <span className="text-[10px] text-on-surface-variant truncate w-full text-center">
                        {d.orders > 0 ? d.orders : ''}
                      </span>
                      <div
                        className={`w-full rounded-t-lg ${d.revenue > 0 ? 'bg-primary' : 'bg-surface-container-low'}`}
                        style={{ height: `${Math.max(4, (d.revenue / maxDaily) * 100)}%` }}
                        title={`${d.date}: ${formatCurrency(d.revenue, currency)}`}
                      />
                      <span className="text-[10px] text-on-surface-variant truncate w-full text-center">
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top items */}
            <Card>
              <CardHeader>
                <CardTitle>Productos más vendidos</CardTitle>
                <CardDescription>Por cantidad en el período</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topItems.length === 0 ? (
                  <p className="text-sm text-on-surface-variant py-4 text-center">Todavía no hay ventas.</p>
                ) : (
                  data.topItems.map((item, i) => (
                    <div key={item.menuItemId} className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-on-surface-variant text-sm">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">{item.quantity} vendidos</p>
                      </div>
                      <span className="text-sm font-bold">{formatCurrency(item.revenue, currency)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Sales by hour */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por hora</CardTitle>
                <CardDescription>Cuándo entran los pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                {data.byHour.length === 0 ? (
                  <p className="text-sm text-on-surface-variant py-4 text-center">Sin datos.</p>
                ) : (
                  <div className="flex items-end gap-1 h-40">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const point = data.byHour.find((h) => h.hour === hour);
                      const value = point?.orders ?? 0;
                      return (
                        <div key={hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <div
                            className={`w-full rounded-t ${value > 0 ? 'bg-primary' : 'bg-surface-container-low'}`}
                            style={{ height: `${Math.max(3, (value / maxHour) * 100)}%` }}
                            title={`${hour}h: ${value} pedidos`}
                          />
                          {hour % 3 === 0 && (
                            <span className="text-[9px] text-on-surface-variant">{hour}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de pedidos</CardTitle>
              <CardDescription>Distribución del período</CardDescription>
            </CardHeader>
            <CardContent>
              {data.status.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-4 text-center">Sin pedidos.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.status.map((s) => (
                    <div key={s.status} className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                      <span className="text-sm font-medium capitalize">{STATUS_LABELS[s.status] || s.status}</span>
                      <span className="font-bold">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
