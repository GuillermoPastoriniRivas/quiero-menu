import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

export class GetRestaurantUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(id: string): Promise<Result<Restaurant, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(id);
    if (!restaurant) return err(new RestaurantNotFoundError());
    return ok(restaurant);
  }
}
