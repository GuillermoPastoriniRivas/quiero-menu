import { Subscription } from '../../../../domain/entities/subscription.entity.js';
import { PlanTier } from '../../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../../domain/enums/payment-provider.enum.js';
import { SubscriptionDocument } from '../schemas/subscription.schema.js';

export class SubscriptionMapper {
  static toDomain(doc: SubscriptionDocument): Subscription {
    return new Subscription(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.plan as PlanTier,
      doc.status as SubscriptionStatus,
      doc.currentPeriodStart,
      doc.currentPeriodEnd,
      doc.canceledAt,
      doc.paymentProvider as PaymentProvider,
      doc.externalCustomerId,
      doc.externalSubscriptionId,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
