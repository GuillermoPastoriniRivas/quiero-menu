import { KitchenAccessToken } from '../entities/kitchen-access-token.entity.js';

export interface KitchenAccessTokenRepository {
  create(data: Omit<KitchenAccessToken, 'id' | 'createdAt' | 'revokedAt'>): Promise<KitchenAccessToken>;
  findById(id: string): Promise<KitchenAccessToken | null>;
  findByToken(token: string): Promise<KitchenAccessToken | null>;
  findByRestaurantId(restaurantId: string): Promise<KitchenAccessToken[]>;
  revoke(id: string): Promise<KitchenAccessToken | null>;
}
