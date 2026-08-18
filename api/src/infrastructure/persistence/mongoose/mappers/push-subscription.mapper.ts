import { PushSubscription } from '../../../../domain/entities/push-subscription.entity.js';
import { PushSubscriptionDocument } from '../schemas/push-subscription.schema.js';

export class PushSubscriptionMapper {
  static toDomain(doc: PushSubscriptionDocument): PushSubscription {
    return new PushSubscription(
      doc._id.toHexString(),
      doc.endpoint,
      { p256dh: doc.keys.p256dh, auth: doc.keys.auth },
      doc.userId ? doc.userId.toHexString() : null,
      doc.restaurantId ? doc.restaurantId.toHexString() : null,
      doc.orderCode ?? null,
      doc.orderSlug ?? null,
      doc.createdAt,
    );
  }
}