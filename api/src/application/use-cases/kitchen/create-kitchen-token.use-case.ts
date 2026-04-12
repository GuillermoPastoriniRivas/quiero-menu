import { v4 as uuidv4 } from 'uuid';
import { KitchenAccessTokenRepository } from '../../../domain/repositories/kitchen-access-token.repository.js';
import { KitchenAccessToken } from '../../../domain/entities/kitchen-access-token.entity.js';

export class CreateKitchenTokenUseCase {
  constructor(private readonly tokenRepo: KitchenAccessTokenRepository) {}

  async execute(restaurantId: string, name: string = ''): Promise<KitchenAccessToken> {
    const token = uuidv4();
    return this.tokenRepo.create({ restaurantId, token, name, expiresAt: null });
  }
}
