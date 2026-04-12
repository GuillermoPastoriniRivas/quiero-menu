import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { BillingRecordRepository } from '../../../domain/repositories/billing-record.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { PaymentProviderPort } from '../../ports/payment-provider.port.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { BillingEventType } from '../../../domain/enums/billing-event-type.enum.js';
import { Result, ok, err } from '../../common/result.js';
import { DomainError } from '../../../domain/errors/domain-errors.js';

export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly billingRecordRepo: BillingRecordRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly paymentProvider: PaymentProviderPort,
  ) {}

  async execute(restaurantId: string): Promise<Result<void, DomainError>> {
    const subscription = await this.subscriptionRepo.findByRestaurantId(restaurantId);
    if (!subscription) {
      return err(new DomainError('NO_SUBSCRIPTION', 'No active subscription found.'));
    }

    if (subscription.plan === PlanTier.FREE) {
      return err(new DomainError('ALREADY_FREE', 'Already on the free plan.'));
    }

    // Cancel at the payment provider
    if (subscription.externalSubscriptionId && subscription.paymentProvider !== PaymentProvider.NONE) {
      try {
        await this.paymentProvider.cancelSubscription(subscription.externalSubscriptionId);
      } catch {
        // Provider cancel failed, but proceed with local downgrade
      }
    }

    // Downgrade to free immediately
    await this.subscriptionRepo.update(subscription.id, {
      plan: PlanTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      canceledAt: new Date(),
      paymentProvider: PaymentProvider.NONE,
      externalCustomerId: null,
      externalSubscriptionId: null,
      currentPeriodEnd: null,
    });

    await this.billingRecordRepo.create({
      restaurantId,
      eventType: BillingEventType.SUBSCRIPTION_CANCELED,
      plan: PlanTier.PRO,
      amountCents: 0,
      description: 'Subscription canceled — downgraded to free',
    });

    // Clear custom domain
    await this.restaurantRepo.update(restaurantId, { customDomain: null });

    return ok(undefined);
  }
}
