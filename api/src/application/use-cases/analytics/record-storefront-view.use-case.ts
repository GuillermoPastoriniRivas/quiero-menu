import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { StorefrontViewRepository } from '../../../domain/repositories/storefront-view.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

export function localDateString(
  timezone: string,
  date: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return parts;
}

export class RecordStorefrontViewUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly viewRepo: StorefrontViewRepository,
  ) {}

  async execute(
    slug: string,
  ): Promise<Result<{ views: number }, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());
    const date = localDateString(restaurant.timezone || 'UTC');
    await this.viewRepo.increment(restaurant.id, date);
    return ok({ views: 1 });
  }
}
