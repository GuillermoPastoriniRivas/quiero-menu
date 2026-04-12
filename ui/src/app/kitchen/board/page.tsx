'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, OrderItem } from '@/types';
import { OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/format';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.NEW]: 'Nuevo',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Listo',
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

export default function KitchenBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const kitchenToken = typeof window !== 'undefined' ? sessionStorage.getItem('kitchenToken') : null;

  const fetchOrders = useCallback(async () => {
    if (!kitchenToken) return;
    try {
      const res = await fetch(`${API_URL}/kitchen/orders`, {
        headers: { 'X-Kitchen-Token': kitchenToken },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.data.filter((o: Order) => [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status)));
    } catch {
      sessionStorage.clear();
      router.push('/kitchen');
    } finally {
      setLoading(false);
    }
  }, [kitchenToken]);

  useEffect(() => {
    if (!kitchenToken) { router.push('/kitchen'); return; }
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [kitchenToken]);

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next || !kitchenToken) return;
    await fetch(`${API_URL}/kitchen/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Kitchen-Token': kitchenToken },
      body: JSON.stringify({ status: next }),
    });
    fetchOrders();
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const columns = [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-bold">Cocina</h1>
        <Button variant="ghost" size="sm" onClick={fetchOrders}>Refrescar</Button>
      </header>
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {columns.map((status) => (
          <div key={status} className="flex w-80 flex-shrink-0 flex-col">
            <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
              {STATUS_LABELS[status]} ({orders.filter((o) => o.status === status).length})
            </h2>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {orders.filter((o) => o.status === status).map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{order.code}</CardTitle>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant={order.deliveryType === 'pickup' ? 'secondary' : 'default'}>
                      {order.deliveryType === 'pickup' ? 'Retiro' : 'Delivery'}
                    </Badge>
                    {order.notes && <p className="text-xs text-muted-foreground italic">{order.notes}</p>}
                    {NEXT_STATUS[status] && (
                      <Button size="sm" className="w-full mt-2" onClick={() => advanceStatus(order.id, status)}>
                        {NEXT_LABEL[status]}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
