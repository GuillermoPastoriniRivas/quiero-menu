import { Subscription } from '../../../domain/entities/subscription.entity.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PLAN_LIMITS, PlanLimits } from '../../../domain/constants/plan-limits.js';

export interface SubscriptionInfo {
  subscription: Subscription | null;
  plan: PlanTier;
  limits: PlanLimits;
  usage: { ordersThisMonth: number };
}

export class GetSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(restaurantId: string): Promise<SubscriptionInfo> {
    const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);

    const plan = subscription?.status === SubscriptionStatus.ACTIVE
      ? subscription.plan
      : PlanTier.FREE;

    const limits = PLAN_LIMITS[plan];

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const ordersThisMonth = await this.orderRepo.countByRestaurantIdSince(restaurantId, monthStart);

    return { subscription, plan, limits, usage: { ordersThisMonth } };
  }
}
