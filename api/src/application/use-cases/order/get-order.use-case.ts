import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { OrderFeedbackRepository } from '../../../domain/repositories/order-feedback.repository.js';
import { OrderFeedbackRating } from '../../../domain/entities/order-feedback.entity.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PLAN_LIMITS } from '../../../domain/constants/plan-limits.js';
import { Result, ok, err } from '../../common/result.js';
import {
  OrderNotFoundError,
  CrossRestaurantAccessError,
} from '../../../domain/errors/domain-errors.js';

export interface GetOrderOutput {
  order: Order;
  items: OrderItem[];
  redacted: boolean;
  feedback: {
    confirmedAt: Date;
    rating: OrderFeedbackRating | null;
    onTime: boolean | null;
    couponCode: string | null;
  } | null;
}

export class GetOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly feedbackRepo?: OrderFeedbackRepository,
  ) {}

  async execute(
    id: string,
    restaurantId: string,
  ): Promise<
    Result<GetOrderOutput, OrderNotFoundError | CrossRestaurantAccessError>
  > {
    const order = await this.orderRepo.findById(id);
    if (!order) return err(new OrderNotFoundError());
    if (order.restaurantId !== restaurantId)
      return err(new CrossRestaurantAccessError());

    const subscription =
      await this.subscriptionRepo.findByRestaurantId(restaurantId);
    const plan =
      subscription?.status === SubscriptionStatus.ACTIVE
        ? subscription.plan
        : PlanTier.FREE;
    const limits = PLAN_LIMITS[plan];

    const items = await this.orderItemRepo.findByOrderId(order.id);
    const fb = await this.feedbackRepo?.findByOrderId(order.id);
    const feedback = fb
      ? {
          confirmedAt: fb.confirmedAt,
          rating: fb.rating,
          onTime: fb.onTime,
          couponCode: fb.couponCode,
        }
      : null;

    // PRO or unlimited — return everything
    if (limits.maxOrdersPerMonth === -1) {
      return ok({ order, items, redacted: false, feedback });
    }

    // Check if this order falls within the monthly limit
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    // Only redact orders from the current month
    if (order.createdAt < monthStart) {
      return ok({ order, items, redacted: false, feedback });
    }

    const cutoffDate = await this.orderRepo.findNthOrderCreatedAt(
      restaurantId,
      monthStart,
      limits.maxOrdersPerMonth,
    );

    if (!cutoffDate || order.createdAt <= cutoffDate) {
      return ok({ order, items, redacted: false, feedback });
    }

    // This order is beyond the limit — redact sensitive data
    const redactedOrder = new Order(
      order.id,
      order.restaurantId,
      order.code,
      order.trackingToken,
      order.status,
      '***',
      '***',
      '***',
      null,
      null,
      order.deliveryType,
      0,
      0,
      0,
      0,
      null,
      '',
      null,
      '',
      order.source,
      order.createdAt,
      order.confirmedAt,
      order.readyAt,
      order.deliveredAt,
      order.statusHistory,
    );

    return ok({ order: redactedOrder, items: [], redacted: true, feedback });
  }
}
