import { KitchenAccessTokenRepository } from '../../../domain/repositories/kitchen-access-token.repository.js';
import { KitchenAccessToken } from '../../../domain/entities/kitchen-access-token.entity.js';

export class ListKitchenTokensUseCase {
  constructor(private readonly tokenRepo: KitchenAccessTokenRepository) {}

  async execute(restaurantId: string): Promise<KitchenAccessToken[]> {
    return this.tokenRepo.findByRestaurantId(restaurantId);
  }
}
