import { OrderRepository, OrderFilters, PaginatedResult } from '../../../domain/repositories/order.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';

export class ListOrdersUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(filters: OrderFilters): Promise<PaginatedResult<Order>> {
    return this.orderRepo.findByFilters(filters);
  }
}
