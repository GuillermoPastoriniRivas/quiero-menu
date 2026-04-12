import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

export class UpdateRestaurantUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(id: string, data: Partial<Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Result<Restaurant, RestaurantNotFoundError>> {
    const updated = await this.restaurantRepo.update(id, data);
    if (!updated) return err(new RestaurantNotFoundError());
    return ok(updated);
  }
}
