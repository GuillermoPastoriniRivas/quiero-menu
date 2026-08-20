import { DeliveryAccessTokenRepository } from '../../../domain/repositories/delivery-access-token.repository.js';
import { DeliveryAccessToken } from '../../../domain/entities/delivery-access-token.entity.js';
import { Result, ok, err } from '../../common/result.js';
import {
  DeliveryTokenInvalidError,
  CrossRestaurantAccessError,
} from '../../../domain/errors/domain-errors.js';

export class RevokeDeliveryTokenUseCase {
  constructor(private readonly tokenRepo: DeliveryAccessTokenRepository) {}

  async execute(
    id: string,
    restaurantId: string,
  ): Promise<
    Result<
      DeliveryAccessToken,
      DeliveryTokenInvalidError | CrossRestaurantAccessError
    >
  > {
    const token = await this.tokenRepo.findById(id);
    if (!token) return err(new DeliveryTokenInvalidError());
    if (token.restaurantId !== restaurantId)
      return err(new CrossRestaurantAccessError());

    const revoked = await this.tokenRepo.revoke(id);
    if (!revoked) return err(new DeliveryTokenInvalidError());
    return ok(revoked);
  }
}
