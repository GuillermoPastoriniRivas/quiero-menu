import { DeliveryAccessToken } from '../../../../domain/entities/delivery-access-token.entity.js';
import { DeliveryAccessTokenDocument } from '../schemas/delivery-access-token.schema.js';

export class DeliveryAccessTokenMapper {
  static toDomain(doc: DeliveryAccessTokenDocument): DeliveryAccessToken {
    return new DeliveryAccessToken(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.token,
      doc.name ?? '',
      doc.createdAt,
      doc.expiresAt,
      doc.revokedAt,
    );
  }
}
