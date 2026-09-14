import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { countrySlugFrom, slugifyCity } from '../../common/slugify.js';
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
    // La ciudad, el país o la región cambian => los slugs geo se recalculan
    // siempre acá (join keys del directorio de 3 niveles).
    const payload =
      data.city !== undefined ||
      data.region !== undefined ||
      data.country !== undefined
        ? {
            ...data,
            ...(data.city !== undefined
              ? { citySlug: slugifyCity(data.city) }
              : {}),
            ...(data.region !== undefined
              ? { regionSlug: slugifyCity(data.region) }
              : {}),
            ...(data.country !== undefined
              ? { countrySlug: countrySlugFrom(data.country) }
              : {}),
          }
        : data;
    const updated = await this.restaurantRepo.update(id, payload);
    if (!updated) return err(new RestaurantNotFoundError());
    return ok(updated);
  }
}
