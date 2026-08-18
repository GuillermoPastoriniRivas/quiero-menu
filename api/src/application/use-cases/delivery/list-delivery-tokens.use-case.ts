import { DeliveryAccessTokenRepository } from '../../../domain/repositories/delivery-access-token.repository.js';
import { DeliveryAccessToken } from '../../../domain/entities/delivery-access-token.entity.js';

export class ListDeliveryTokensUseCase {
  constructor(private readonly tokenRepo: DeliveryAccessTokenRepository) {}

  async execute(restaurantId: string): Promise<DeliveryAccessToken[]> {
    return this.tokenRepo.findByRestaurantId(restaurantId);
  }
}
