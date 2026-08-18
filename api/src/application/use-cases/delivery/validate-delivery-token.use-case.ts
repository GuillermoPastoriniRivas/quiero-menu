import { DeliveryAccessTokenRepository } from '../../../domain/repositories/delivery-access-token.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { DeliveryTokenInvalidError } from '../../../domain/errors/domain-errors.js';

export class ValidateDeliveryTokenUseCase {
  constructor(private readonly tokenRepo: DeliveryAccessTokenRepository) {}

  async execute(token: string): Promise<Result<{ restaurantId: string }, DeliveryTokenInvalidError>> {
    const stored = await this.tokenRepo.findByToken(token);
    if (!stored) return err(new DeliveryTokenInvalidError());
    if (stored.revokedAt) return err(new DeliveryTokenInvalidError());
    return ok({ restaurantId: stored.restaurantId });
  }
}
