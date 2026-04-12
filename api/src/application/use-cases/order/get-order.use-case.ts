import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { OrderNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class GetOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
  ) {}

  async execute(id: string, restaurantId: string): Promise<Result<{ order: Order; items: OrderItem[] }, OrderNotFoundError | CrossRestaurantAccessError>> {
    const order = await this.orderRepo.findById(id);
    if (!order) return err(new OrderNotFoundError());
    if (order.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const items = await this.orderItemRepo.findByOrderId(order.id);
    return ok({ order, items });
  }
}
