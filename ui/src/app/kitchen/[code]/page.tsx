'use client';

import { OrderBoard, type BoardConfig } from '@/components/ops/order-board';
import { OrderStatus } from '@/types';

const KITCHEN: BoardConfig = {
  title: 'Cocina',
  headerIcon: 'restaurant',
  tokenHeader: 'X-Kitchen-Token',
  apiBase: '/kitchen',
  invalidLabel: 'cocina',
  variant: 'kitchen',
  alertOn: OrderStatus.NEW,
  statuses: [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY],
  meta: {
    [OrderStatus.NEW]: {
      label: 'Nuevo',
      icon: 'receipt_long',
      empty: 'Sin pedidos nuevos',
      next: { status: OrderStatus.PREPARING, label: 'Empezar a preparar', icon: 'restaurant' },
    },
    [OrderStatus.PREPARING]: {
      label: 'Preparando',
      icon: 'ramen_dining',
      empty: 'Sin pedidos en preparación',
      next: { status: OrderStatus.READY, label: 'Marcar listo', icon: 'check_circle' },
    },
    [OrderStatus.READY]: {
      label: 'Listo',
      icon: 'check_circle',
      empty: 'Sin pedidos listos',
      next: { status: OrderStatus.DELIVERED, label: 'Entregado', icon: 'handshake' },
    },
  },
};

export default function KitchenBoardPage() {
  return <OrderBoard config={KITCHEN} />;
}
