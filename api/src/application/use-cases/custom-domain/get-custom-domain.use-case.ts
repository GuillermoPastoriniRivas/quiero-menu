import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { CustomDomainStatus } from '../../../domain/entities/restaurant.entity.js';

export interface CustomDomainInfo {
  domain: string | null;
  status: CustomDomainStatus;
}

export class GetCustomDomainUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(
    restaurantId: string,
  ): Promise<Result<CustomDomainInfo, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());
    return ok({
      domain: restaurant.customDomain,
      status: restaurant.customDomainStatus,
    });
  }
}
