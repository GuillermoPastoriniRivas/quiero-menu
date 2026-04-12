import { PlanTier } from '../enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../enums/subscription-status.enum.js';
import { PaymentProvider } from '../enums/payment-provider.enum.js';

export class Subscription {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly plan: PlanTier,
    public readonly status: SubscriptionStatus,
    public readonly currentPeriodStart: Date,
    public readonly currentPeriodEnd: Date | null,
    public readonly canceledAt: Date | null,
    public readonly paymentProvider: PaymentProvider,
    public readonly externalCustomerId: string | null,
    public readonly externalSubscriptionId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
