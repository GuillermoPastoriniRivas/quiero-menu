import { OrderItem } from '../entities/order-item.entity.js';

export interface OrderItemRepository {
  createBulk(items: Omit<OrderItem, 'id'>[]): Promise<OrderItem[]>;
  findByOrderId(orderId: string): Promise<OrderItem[]>;
}
