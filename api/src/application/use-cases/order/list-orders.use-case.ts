import { OrderRepository, OrderFilters, PaginatedResult } from '../../../domain/repositories/order.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PLAN_LIMITS } from '../../../domain/constants/plan-limits.js';

export interface OrderWithRedaction extends Order {
  redacted: boolean;
}

export interface PlanInfo {
  plan: PlanTier;
  ordersUsed: number;
  ordersLimit: number;
  redactedCount: number;
}

export interface ListOrdersOutput {
  data: OrderWithRedaction[];
  meta: { total: number; page: number; pages: number };
  planInfo: PlanInfo;
}

function redactOrder(order: Order): OrderWithRedaction {
  return Object.assign(
    new Order(
      order.id,
      order.restaurantId,
      order.code,
      order.status,
      '***',
      '***',
      '***',
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
    ),
    { redacted: true },
  );
}

export class ListOrdersUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(filters: OrderFilters): Promise<ListOrdersOutput> {
    const subscription = await this.subscriptionRepo.findByRestaurantId(filters.restaurantId);
    const plan = subscription?.status === SubscriptionStatus.ACTIVE
      ? subscription.plan
      : PlanTier.FREE;
    const limits = PLAN_LIMITS[plan];

    const result = await this.orderRepo.findByFilters(filters);

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const ordersUsed = await this.orderRepo.countByRestaurantIdSince(filters.restaurantId, monthStart);

    // If PRO or unlimited, no redaction
    if (limits.maxOrdersPerMonth === -1) {
      const data = result.data.map((o) => Object.assign(o, { redacted: false }) as OrderWithRedaction);
      return {
        data,
        meta: result.meta,
        planInfo: { plan, ordersUsed, ordersLimit: -1, redactedCount: 0 },
      };
    }

    // FREE plan: find the cutoff date (the createdAt of the Nth order this month)
    const cutoffDate = await this.orderRepo.findNthOrderCreatedAt(
      filters.restaurantId,
      monthStart,
      limits.maxOrdersPerMonth,
    );

    let redactedCount = 0;

    const data = result.data.map((order) => {
      // If no cutoff, all orders are within limit
      if (!cutoffDate) {
        return Object.assign(order, { redacted: false }) as OrderWithRedaction;
      }

      // Orders created after the cutoff (the Nth order) are redacted
      // Orders from before this month are never redacted
      if (order.createdAt >= monthStart && order.createdAt > cutoffDate) {
        redactedCount++;
        return redactOrder(order);
      }

      return Object.assign(order, { redacted: false }) as OrderWithRedaction;
    });

    return {
      data,
      meta: result.meta,
      planInfo: {
        plan,
        ordersUsed,
        ordersLimit: limits.maxOrdersPerMonth,
        redactedCount: Math.max(0, ordersUsed - limits.maxOrdersPerMonth),
      },
    };
  }
}
