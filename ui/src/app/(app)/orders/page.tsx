'use client';

import { useEffect, useState } from 'react';
import { useOrderStore } from '@/stores/order.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrderStatus } from '@/types';
import type { Order, OrderItem } from '@/types';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/format';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.DRAFT]: 'Borrador',
  [OrderStatus.NEW]: 'Nuevo',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Listo',
  [OrderStatus.DELIVERING]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  [OrderStatus.DRAFT]: 'secondary',
  [OrderStatus.NEW]: 'default',
  [OrderStatus.PREPARING]: 'default',
  [OrderStatus.READY]: 'default',
  [OrderStatus.DELIVERING]: 'default',
  [OrderStatus.DELIVERED]: 'secondary',
  [OrderStatus.CANCELLED]: 'destructive',
};

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  [OrderStatus.DRAFT]: { status: OrderStatus.NEW, label: 'Confirmar' },
  [OrderStatus.NEW]: { status: OrderStatus.PREPARING, label: 'Preparar' },
  [OrderStatus.PREPARING]: { status: OrderStatus.READY, label: 'Listo' },
  [OrderStatus.READY]: { status: OrderStatus.DELIVERED, label: 'Entregado' },
};

export default function OrdersPage() {
  const { orders, fetch: fetchOrders, updateStatus, getOrder, connectRealtime, disconnectRealtime } = useOrderStore();
  const [tab, setTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<{ order: Order; items: OrderItem[] } | null>(null);

  useEffect(() => {
    fetchOrders();
    connectRealtime();
    return () => disconnectRealtime();
  }, []);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus(id, status);
      toast.success(`Pedido actualizado a ${STATUS_LABELS[status]}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleViewOrder = async (id: string) => {
    const data = await getOrder(id);
    setSelectedOrder(data);
  };

  const filteredOrders = tab === 'all'
    ? orders
    : tab === 'active'
    ? orders.filter((o) => [OrderStatus.DRAFT, OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERING].includes(o.status))
    : orders.filter((o) => o.status === tab);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value={OrderStatus.DRAFT}>Borradores</TabsTrigger>
          <TabsTrigger value={OrderStatus.DELIVERED}>Entregados</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="cursor-pointer hover:bg-accent/50" onClick={() => handleViewOrder(order.id)}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold">{order.code}</p>
                  <p className="text-sm text-muted-foreground">{order.customerName}</p>
                </div>
                <Badge variant={STATUS_COLORS[order.status] as any}>{STATUS_LABELS[order.status]}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(order.total)}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
                </div>
                {NEXT_STATUS[order.status] && (
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, NEXT_STATUS[order.status]!.status); }}
                  >
                    {NEXT_STATUS[order.status]!.label}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay pedidos.</p>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido {selectedOrder.order.code}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Estado</span>
                  <Badge>{STATUS_LABELS[selectedOrder.order.status]}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cliente</span>
                  <span>{selectedOrder.order.customerName} - {selectedOrder.order.customerPhone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tipo</span>
                  <span>{selectedOrder.order.deliveryType === 'pickup' ? 'Retiro' : 'Delivery'}</span>
                </div>
                {selectedOrder.order.customerAddress && (
                  <div className="flex justify-between text-sm">
                    <span>Dirección</span>
                    <span>{selectedOrder.order.customerAddress}</span>
                  </div>
                )}
                <div className="border-t pt-3 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.menuItemName}{item.variantName ? ` (${item.variantName})` : ''}</span>
                      <span>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(selectedOrder.order.subtotal)}</span></div>
                  {selectedOrder.order.deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Envío</span><span>{formatCurrency(selectedOrder.order.deliveryFee)}</span></div>}
                  <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(selectedOrder.order.total)}</span></div>
                </div>
                {selectedOrder.order.notes && <p className="text-sm italic text-muted-foreground">Notas: {selectedOrder.order.notes}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.order.createdAt)}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
