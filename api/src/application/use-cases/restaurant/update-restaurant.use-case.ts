import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { countrySlugFrom, slugifyCity } from '../../common/slugify.js';
import { deriveGeoFromCity } from '../../common/geo.js';
import {
  RestaurantNotFoundError,
  SlugAlreadyExistsError,
} from '../../../domain/errors/domain-errors.js';

type RestaurantPatch = {
  -readonly [K in keyof Omit<
    Restaurant,
    'id' | 'createdAt' | 'updatedAt'
  >]?: Restaurant[K];
};

export class UpdateRestaurantUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(
    id: string,
    data: RestaurantPatch,
  ): Promise<
    Result<Restaurant, RestaurantNotFoundError | SlugAlreadyExistsError>
  > {
    if (data.slug) {
      const existing = await this.restaurantRepo.findBySlug(data.slug);
      if (existing && existing.id !== id)
        return err(new SlugAlreadyExistsError());
    }
    const payload = await this.withGeo(id, data);
    const updated = await this.restaurantRepo.update(id, payload);
    if (!updated) return err(new RestaurantNotFoundError());
    return ok(updated);
  }

  private async withGeo(
    id: string,
    data: RestaurantPatch,
  ): Promise<RestaurantPatch> {
    if (
      data.city === undefined &&
      data.region === undefined &&
      data.country === undefined
    ) {
      return data;
    }
    const payload: RestaurantPatch = { ...data };
    if (data.city !== undefined) {
      payload.citySlug = slugifyCity(data.city);
      if (data.region === undefined) {
        const country =
          data.country ??
          (await this.restaurantRepo.findById(id))?.country ??
          '';
        const geo = deriveGeoFromCity(data.city, country);
        payload.region = geo.region;
        payload.regionSlug = geo.regionSlug;
        if (data.country === undefined && geo.countrySlug) {
          payload.countrySlug = geo.countrySlug;
        }
      }
    }
    if (data.region !== undefined)
      payload.regionSlug = slugifyCity(data.region);
    if (data.country !== undefined)
      payload.countrySlug = countrySlugFrom(data.country);
    return payload;
  }
}
