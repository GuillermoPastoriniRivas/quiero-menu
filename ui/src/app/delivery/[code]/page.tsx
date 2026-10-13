'use client';

import { OrderBoard, type BoardConfig } from '@/components/ops/order-board';
import { OrderStatus } from '@/types';

const DELIVERY: BoardConfig = {
  title: 'Delivery',
  headerIcon: 'local_shipping',
  tokenHeader: 'X-Delivery-Token',
  apiBase: '/delivery',
  invalidLabel: 'delivery',
  variant: 'delivery',
  alertOn: OrderStatus.READY,
  statuses: [OrderStatus.READY, OrderStatus.DELIVERING],
  meta: {
    [OrderStatus.READY]: {
      label: 'Listo para recoger',
      icon: 'check_circle',
      empty: 'Sin pedidos listos para recoger',
      next: { status: OrderStatus.DELIVERING, label: 'Recoger y salir', icon: 'local_shipping' },
    },
    [OrderStatus.DELIVERING]: {
      label: 'En camino',
      icon: 'local_shipping',
      empty: 'Sin pedidos en camino',
      next: { status: OrderStatus.DELIVERED, label: 'Entregado', icon: 'handshake' },
    },
  },
};

export default function DeliveryBoardPage() {
  return <OrderBoard config={DELIVERY} />;
}
