import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { slugifyCity } from '../../common/slugify.js';
import {
  RestaurantNotFoundError,
  SlugAlreadyExistsError,
} from '../../../domain/errors/domain-errors.js';

export class UpdateRestaurantUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(
    id: string,
    data: Partial<Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<
    Result<Restaurant, RestaurantNotFoundError | SlugAlreadyExistsError>
  > {
    if (data.slug) {
      const existing = await this.restaurantRepo.findBySlug(data.slug);
      if (existing && existing.id !== id)
        return err(new SlugAlreadyExistsError());
    }
    // La ciudad cambia => el slug de ciudad se recalcula siempre acá.
    const payload =
      data.city !== undefined
        ? { ...data, citySlug: slugifyCity(data.city) }
        : data;
    const updated = await this.restaurantRepo.update(id, payload);
    if (!updated) return err(new RestaurantNotFoundError());
    return ok(updated);
  }
}
