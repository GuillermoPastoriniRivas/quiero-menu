import { KitchenAccessTokenRepository } from '../../../domain/repositories/kitchen-access-token.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { KitchenTokenInvalidError } from '../../../domain/errors/domain-errors.js';

export class ValidateKitchenTokenUseCase {
  constructor(private readonly tokenRepo: KitchenAccessTokenRepository) {}

  async execute(token: string): Promise<Result<{ restaurantId: string }, KitchenTokenInvalidError>> {
    const stored = await this.tokenRepo.findByToken(token);
    if (!stored) return err(new KitchenTokenInvalidError());
    if (stored.revokedAt) return err(new KitchenTokenInvalidError());
    if (stored.expiresAt && stored.expiresAt < new Date()) return err(new KitchenTokenInvalidError());
    return ok({ restaurantId: stored.restaurantId });
  }
}
