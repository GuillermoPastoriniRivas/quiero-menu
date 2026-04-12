import { KitchenAccessTokenRepository } from '../../../domain/repositories/kitchen-access-token.repository.js';
import { KitchenAccessToken } from '../../../domain/entities/kitchen-access-token.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { KitchenTokenInvalidError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class RevokeKitchenTokenUseCase {
  constructor(private readonly tokenRepo: KitchenAccessTokenRepository) {}

  async execute(id: string, restaurantId: string): Promise<Result<KitchenAccessToken, KitchenTokenInvalidError | CrossRestaurantAccessError>> {
    const token = await this.tokenRepo.findById(id);
    if (!token) return err(new KitchenTokenInvalidError());
    if (token.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const revoked = await this.tokenRepo.revoke(id);
    if (!revoked) return err(new KitchenTokenInvalidError());
    return ok(revoked);
  }
}
