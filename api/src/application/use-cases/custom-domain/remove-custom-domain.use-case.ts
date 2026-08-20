import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';

export class RemoveCustomDomainUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(
    restaurantId: string,
  ): Promise<Result<Restaurant, RestaurantNotFoundError>> {
    const updated = await this.restaurantRepo.update(restaurantId, {
      customDomain: null,
      customDomainStatus: null,
    });
    if (!updated) return err(new RestaurantNotFoundError());
    return ok(updated);
  }
}
