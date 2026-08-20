'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MaterialIcon } from '@/components/ui/material-icon';
import type { CustomerSummary, Order, PaginatedResponse } from '@/types';
import { OrderStatus } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/format';

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.NEW]: 'Nuevo',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Listo',
  [OrderStatus.DELIVERING]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

export default function CustomersPage() {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Record<string, Order[]>>({});
  const [ordersLoading, setOrdersLoading] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '30' });
      if (q.trim()) params.set('search', q.trim());
      const data = await api.get<PaginatedResponse<CustomerSummary>>(`/customers?${params.toString()}`);
      setCustomers(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
    fetchCustomers(1, '');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchCustomers(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleExpand = async (phone: string) => {
    if (expanded === phone) {
      setExpanded(null);
      return;
    }
    setExpanded(phone);
    if (!customerOrders[phone]) {
      setOrdersLoading(phone);
      try {
        const data = await api.get<PaginatedResponse<Order>>(
          `/customers/${encodeURIComponent(phone)}/orders?page=1&limit=20`,
        );
        setCustomerOrders((prev) => ({ ...prev, [phone]: data.data }));
      } finally {
        setOrdersLoading(null);
      }
    }
  };

  const currency = restaurant?.currency || 'ARS';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Clientes</h1>
        <div className="relative">
          <MaterialIcon name="search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por teléfono o nombre"
            className="pl-9 w-64"
          />
        </div>
      </div>

      {meta && meta.total > 0 && (
        <p className="text-sm text-on-surface-variant">
          {meta.total} clientes {search.trim() ? `que coinciden con "${search.trim()}"` : ''}
        </p>
      )}

      {loading && customers.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center space-y-3">
            <MaterialIcon name="group" size="xl" className="text-on-surface-variant/40" />
            <p className="text-on-surface-variant">Todavía no hay clientes registrados.</p>
            <p className="text-sm text-on-surface-variant">Los clientes aparecen acá cuando hacen su primer pedido.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <Card key={c.phone} size="sm" className="shadow-sm border border-outline-variant/10">
              <button
                type="button"
                className="w-full text-left px-4 py-3 flex items-center gap-4"
                onClick={() => toggleExpand(c.phone)}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {(c.name || c.phone).slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.name || 'Cliente'}</p>
                  <p className="text-xs text-on-surface-variant">{c.phone}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-center">
                    <p className="font-bold">{c.orderCount}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Pedidos</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{formatCurrency(c.totalSpent, currency)}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Gastado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium">{formatRelativeTime(c.lastOrderAt)}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Último pedido</p>
                  </div>
                </div>
                <MaterialIcon
                  name={expanded === c.phone ? 'expand_less' : 'expand_more'}
                  size="sm"
                  className="text-on-surface-variant"
                />
              </button>

              {expanded === c.phone && (
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="sm:hidden flex gap-4 text-center">
                    <div className="flex-1">
                      <p className="font-bold">{c.orderCount}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Pedidos</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{formatCurrency(c.totalSpent, currency)}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Gastado</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{formatRelativeTime(c.lastOrderAt)}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Último</p>
                    </div>
                  </div>

                  {ordersLoading === c.phone ? (
                    <p className="text-sm text-on-surface-variant flex items-center gap-2 py-2">
                      <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                      Cargando pedidos...
                    </p>
                  ) : (
                    <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
                      {(customerOrders[c.phone] ?? []).length === 0 ? (
                        <p className="text-sm text-on-surface-variant py-2">Sin pedidos registrados.</p>
                      ) : (
                        customerOrders[c.phone]!.map((o) => (
                          <div key={o.id} className="flex items-center justify-between text-sm">
                            <div className="min-w-0">
                              <span className="font-semibold">{o.code}</span>
                              <span className="text-xs text-on-surface-variant ml-2">{formatRelativeTime(o.createdAt)}</span>
                              {o.couponCode && (
                                <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 rounded px-1 py-0.5 ml-2">{o.couponCode}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="capitalize text-xs text-on-surface-variant">{STATUS_LABELS[o.status] || o.status}</span>
                              <span className="font-bold">{formatCurrency(o.total, currency)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchCustomers(page - 1, search); }}>
            Anterior
          </Button>
          <span className="text-sm text-on-surface-variant">Página {meta.page} de {meta.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => { setPage(page + 1); fetchCustomers(page + 1, search); }}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
