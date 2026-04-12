import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { BillingRecordRepository } from '../../../domain/repositories/billing-record.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { WebhookEvent } from '../../ports/payment-provider.port.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { BillingEventType } from '../../../domain/enums/billing-event-type.enum.js';
import { PLAN_LIMITS } from '../../../domain/constants/plan-limits.js';

export class HandlePaymentWebhookUseCase {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly billingRecordRepo: BillingRecordRepository,
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case 'subscription_created':
        return this.handleSubscriptionCreated(event);
      case 'subscription_updated':
        return this.handleSubscriptionUpdated(event);
      case 'payment_success':
        return this.handlePaymentSuccess(event);
      case 'payment_failed':
        return this.handlePaymentFailed(event);
      case 'subscription_canceled':
      case 'subscription_expired':
        return this.handleSubscriptionEnded(event);
    }
  }

  private async handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
    if (!event.tenantId) return;

    const plan = event.plan ?? PlanTier.PRO;
    const now = new Date();
    const periodEnd = event.currentPeriodEnd ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const existing = await this.subscriptionRepo.findByRestaurantId(event.tenantId);

    if (existing) {
      if (existing.externalSubscriptionId === event.externalSubscriptionId && existing.status === SubscriptionStatus.ACTIVE) {
        return;
      }

      await this.subscriptionRepo.update(existing.id, {
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
        paymentProvider: PaymentProvider.LEMON_SQUEEZY,
        externalCustomerId: event.externalCustomerId,
        externalSubscriptionId: event.externalSubscriptionId,
      });
    } else {
      await this.subscriptionRepo.create({
        restaurantId: event.tenantId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        canceledAt: null,
        paymentProvider: PaymentProvider.LEMON_SQUEEZY,
        externalCustomerId: event.externalCustomerId,
        externalSubscriptionId: event.externalSubscriptionId,
      });
    }

    const limits = PLAN_LIMITS[plan];
    await this.billingRecordRepo.create({
      restaurantId: event.tenantId,
      eventType: BillingEventType.SUBSCRIPTION_CREATED,
      plan,
      amountCents: limits.priceMonthly,
      description: `Subscribed to ${plan} plan via Lemon Squeezy`,
    });
  }

  private async handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
    const subscription = await this.subscriptionRepo.findByExternalSubscriptionId(event.externalSubscriptionId);
    if (!subscription) return;

    const updates: Record<string, unknown> = {};

    if (event.currentPeriodEnd) {
      updates.currentPeriodEnd = event.currentPeriodEnd;
      updates.currentPeriodStart = new Date();
    }

    if (event.plan && event.plan !== subscription.plan) {
      updates.plan = event.plan;
    }

    const activeStatuses = new Set(['active', 'on_trial', 'past_due']);
    if (activeStatuses.has(event.status)) {
      updates.status = event.status === 'past_due' ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.ACTIVE;
    }

    if (Object.keys(updates).length > 0) {
      await this.subscriptionRepo.update(subscription.id, updates as any);
    }

    if (event.plan && event.plan !== subscription.plan) {
      await this.billingRecordRepo.create({
        restaurantId: subscription.restaurantId,
        eventType: BillingEventType.PLAN_CHANGED,
        plan: event.plan,
        amountCents: PLAN_LIMITS[event.plan].priceMonthly,
        description: `Plan changed from ${subscription.plan} to ${event.plan}`,
      });
    }
  }

  private async handlePaymentSuccess(event: WebhookEvent): Promise<void> {
    const subscription = await this.subscriptionRepo.findByExternalSubscriptionId(event.externalSubscriptionId);
    if (!subscription) return;

    const plan = event.plan ?? subscription.plan;
    const limits = PLAN_LIMITS[plan];

    await this.billingRecordRepo.create({
      restaurantId: subscription.restaurantId,
      eventType: BillingEventType.PAYMENT_SUCCESS,
      plan,
      amountCents: limits.priceMonthly,
      description: `Payment received — $${(limits.priceMonthly / 100).toFixed(2)}/mo`,
    });

    if (event.currentPeriodEnd) {
      await this.subscriptionRepo.update(subscription.id, {
        currentPeriodEnd: event.currentPeriodEnd,
        status: SubscriptionStatus.ACTIVE,
      });
    }
  }

  private async handlePaymentFailed(event: WebhookEvent): Promise<void> {
    const subscription = await this.subscriptionRepo.findByExternalSubscriptionId(event.externalSubscriptionId);
    if (!subscription) return;

    await this.subscriptionRepo.update(subscription.id, {
      status: SubscriptionStatus.PAST_DUE,
    });

    await this.billingRecordRepo.create({
      restaurantId: subscription.restaurantId,
      eventType: BillingEventType.PAYMENT_FAILED,
      plan: subscription.plan,
      amountCents: 0,
      description: `Payment failed for ${subscription.plan} plan`,
    });
  }

  private async handleSubscriptionEnded(event: WebhookEvent): Promise<void> {
    const subscription = await this.subscriptionRepo.findByExternalSubscriptionId(event.externalSubscriptionId);
    if (!subscription) return;

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
      restaurantId: subscription.restaurantId,
      eventType: BillingEventType.SUBSCRIPTION_CANCELED,
      plan: subscription.plan,
      amountCents: 0,
      description: `Subscription ended — downgraded to free`,
    });

    // Clear custom domain on downgrade
    await this.restaurantRepo.update(subscription.restaurantId, { customDomain: null });
  }
}
