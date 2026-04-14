import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PLAN_LIMITS } from '../../../domain/constants/plan-limits.js';
import { Result, ok, err } from '../../common/result.js';
import { OrderNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export interface GetOrderOutput {
  order: Order;
  items: OrderItem[];
  redacted: boolean;
}

export class GetOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(id: string, restaurantId: string): Promise<Result<GetOrderOutput, OrderNotFoundError | CrossRestaurantAccessError>> {
    const order = await this.orderRepo.findById(id);
    if (!order) return err(new OrderNotFoundError());
    if (order.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
    const plan = subscription?.status === SubscriptionStatus.ACTIVE
      ? subscription.plan
      : PlanTier.FREE;
    const limits = PLAN_LIMITS[plan];

    const items = await this.orderItemRepo.findByOrderId(order.id);

    // PRO or unlimited — return everything
    if (limits.maxOrdersPerMonth === -1) {
      return ok({ order, items, redacted: false });
    }

    // Check if this order falls within the monthly limit
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    // Only redact orders from the current month
    if (order.createdAt < monthStart) {
      return ok({ order, items, redacted: false });
    }

    const cutoffDate = await this.orderRepo.findNthOrderCreatedAt(
      restaurantId,
      monthStart,
      limits.maxOrdersPerMonth,
    );

    if (!cutoffDate || order.createdAt <= cutoffDate) {
      return ok({ order, items, redacted: false });
    }

    // This order is beyond the limit — redact sensitive data
    const redactedOrder = new Order(
      order.id,
      order.restaurantId,
      order.code,
      order.status,
      '***',
      '***',
      '***',
      null,
      null,
      order.deliveryType,
      order.deliveryZoneId,
      0,
      0,
      0,
      '',
      '',
      order.source,
      order.createdAt,
      order.confirmedAt,
      order.readyAt,
      order.deliveredAt,
    );

    return ok({ order: redactedOrder, items: [], redacted: true });
  }
}
