import {
  OrderRepository,
  PaginatedResult,
} from '../../../domain/repositories/order.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';

export class ListCustomerOrdersUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(
    restaurantId: string,
    phone: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepo.findOrdersByCustomer(
      restaurantId,
      phone,
      page,
      limit,
    );
  }
}
