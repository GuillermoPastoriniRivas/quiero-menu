import {
  OrderRepository,
  OrderFilters,
} from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PLAN_LIMITS } from '../../../domain/constants/plan-limits.js';

export interface OrderWithRedaction extends Order {
  redacted: boolean;
  items: OrderItem[];
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

function redactOrder(order: Order): Order {
  return new Order(
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
}

export class ListOrdersUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(filters: OrderFilters): Promise<ListOrdersOutput> {
    const subscription = await this.subscriptionRepo.findByRestaurantId(
      filters.restaurantId,
    );
    const plan =
      subscription?.status === SubscriptionStatus.ACTIVE
        ? subscription.plan
        : PlanTier.FREE;
    const limits = PLAN_LIMITS[plan];

    const result = await this.orderRepo.findByFilters(filters);

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const ordersUsed = await this.orderRepo.countByRestaurantIdSince(
      filters.restaurantId,
      monthStart,
    );

    // If PRO or unlimited, no redaction
    let data: OrderWithRedaction[];
    if (limits.maxOrdersPerMonth === -1) {
      data = result.data.map(
        (o) => ({ ...o, redacted: false, items: [] }) as OrderWithRedaction,
      );
    } else {
      // FREE plan: find the cutoff date (the createdAt of the Nth order this month)
      const cutoffDate = await this.orderRepo.findNthOrderCreatedAt(
        filters.restaurantId,
        monthStart,
        limits.maxOrdersPerMonth,
      );

      data = result.data.map((order) => {
        // If no cutoff, all orders are within limit
        if (!cutoffDate) {
          return { ...order, redacted: false, items: [] } as OrderWithRedaction;
        }

        // Orders created after the cutoff (the Nth order) are redacted
        // Orders from before this month are never redacted
        if (order.createdAt >= monthStart && order.createdAt > cutoffDate) {
          return {
            ...redactOrder(order),
            redacted: true,
            items: [],
          } as OrderWithRedaction;
        }

        return { ...order, redacted: false, items: [] } as OrderWithRedaction;
      });
    }

    // Batch-load items for visible orders (single query, no N+1)
    const visibleIds = data.filter((o) => !o.redacted).map((o) => o.id);
    const items =
      visibleIds.length > 0
        ? await this.orderItemRepo.findByOrderIds(visibleIds)
        : [];
    const itemsByOrderId = new Map<string, OrderItem[]>();
    for (const item of items) {
      const list = itemsByOrderId.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    return {
      data: data.map((o) => ({
        ...o,
        items: o.redacted ? [] : (itemsByOrderId.get(o.id) ?? []),
      })),
      meta: result.meta,
      planInfo:
        limits.maxOrdersPerMonth === -1
          ? { plan, ordersUsed, ordersLimit: -1, redactedCount: 0 }
          : {
              plan,
              ordersUsed,
              ordersLimit: limits.maxOrdersPerMonth,
              redactedCount: Math.max(0, ordersUsed - limits.maxOrdersPerMonth),
            },
    };
  }
}
