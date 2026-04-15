import { Order } from '../entities/order.entity.js';
import { OrderStatus } from '../enums/order-status.enum.js';

export interface OrderFilters {
  restaurantId: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; pages: number };
}

export interface OrderRepository {
  create(data: Omit<Order, 'id' | 'createdAt' | 'confirmedAt' | 'readyAt' | 'deliveredAt'>): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByCode(restaurantId: string, code: string): Promise<Order | null>;
  findByFilters(filters: OrderFilters): Promise<PaginatedResult<Order>>;
  updateStatus(id: string, status: OrderStatus, timestamps?: Partial<Pick<Order, 'confirmedAt' | 'readyAt' | 'deliveredAt'>>): Promise<Order | null>;
  updateReceiptUrl(id: string, receiptUrl: string): Promise<Order | null>;
  generateNextCode(restaurantId: string): Promise<string>;
  countByRestaurantIdSince(restaurantId: string, since: Date): Promise<number>;
  findNthOrderCreatedAt(restaurantId: string, since: Date, n: number): Promise<Date | null>;
}
