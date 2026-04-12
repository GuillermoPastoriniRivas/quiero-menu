import { KitchenAccessToken } from '../../../../domain/entities/kitchen-access-token.entity.js';
import { KitchenAccessTokenDocument } from '../schemas/kitchen-access-token.schema.js';

export class KitchenAccessTokenMapper {
  static toDomain(doc: KitchenAccessTokenDocument): KitchenAccessToken {
    return new KitchenAccessToken(
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
