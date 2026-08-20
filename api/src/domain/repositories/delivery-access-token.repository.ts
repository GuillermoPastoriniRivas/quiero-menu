import { DeliveryAccessToken } from '../entities/delivery-access-token.entity.js';

export interface DeliveryAccessTokenRepository {
  create(
    data: Omit<DeliveryAccessToken, 'id' | 'createdAt' | 'revokedAt'>,
  ): Promise<DeliveryAccessToken>;
  findById(id: string): Promise<DeliveryAccessToken | null>;
  findByToken(token: string): Promise<DeliveryAccessToken | null>;
  findByRestaurantId(restaurantId: string): Promise<DeliveryAccessToken[]>;
  revoke(id: string): Promise<DeliveryAccessToken | null>;
  deleteManyByRestaurantId(restaurantId: string): Promise<void>;
}
