import type { OrderStatus } from '@/types';
import { OrderStatus as OrderStatusEnum } from '@/types';
import type { Badge } from '@/components/ui/badge';

export const STATUS_LABELS: Record<string, string> = {
  [OrderStatusEnum.NEW]: 'Nuevo',
  [OrderStatusEnum.PREPARING]: 'Preparando',
  [OrderStatusEnum.READY]: 'Listo',
  [OrderStatusEnum.DELIVERING]: 'En camino',
  [OrderStatusEnum.DELIVERED]: 'Entregado',
  [OrderStatusEnum.CANCELLED]: 'Cancelado',
};

export const STATUS_BADGE_VARIANT: Record<string, NonNullable<React.ComponentProps<typeof Badge>['variant']>> = {
  [OrderStatusEnum.NEW]: 'nuevo',
  [OrderStatusEnum.PREPARING]: 'preparando',
  [OrderStatusEnum.READY]: 'listo',
  [OrderStatusEnum.DELIVERING]: 'tonal',
  [OrderStatusEnum.DELIVERED]: 'secondary',
  [OrderStatusEnum.CANCELLED]: 'destructive',
};

export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: string }>> = {
  [OrderStatusEnum.NEW]: { status: OrderStatusEnum.PREPARING, label: 'Aceptar y Preparar', icon: 'restaurant' },
  [OrderStatusEnum.PREPARING]: { status: OrderStatusEnum.READY, label: 'Marcar como Listo', icon: 'check_circle' },
  [OrderStatusEnum.READY]: { status: OrderStatusEnum.DELIVERED, label: 'Marcar como Entregado', icon: 'handshake' },
};

export const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatusEnum.NEW,
  OrderStatusEnum.PREPARING,
  OrderStatusEnum.READY,
  OrderStatusEnum.DELIVERING,
];

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}