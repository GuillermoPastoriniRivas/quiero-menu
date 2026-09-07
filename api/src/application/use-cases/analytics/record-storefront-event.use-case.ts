import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { StorefrontEventRepository } from '../../../domain/repositories/storefront-event.repository.js';
import { StorefrontEventType } from '../../../domain/enums/storefront-event-type.enum.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { localDateString } from './record-storefront-view.use-case.js';

/**
 * Registra un click de contacto en el storefront (WhatsApp, Maps, Instagram).
 * Es la métrica del pitch: "12 personas te escribieron desde el sitio".
 * El evento se manda por sendBeacon desde la UI; el tipo viaja en query.
 */
export class RecordStorefrontEventUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly eventRepo: StorefrontEventRepository,
  ) {}

  async execute(
    slug: string,
    type: StorefrontEventType,
  ): Promise<Result<{ ok: true }, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());
    const date = localDateString(restaurant.timezone || 'UTC');
    await this.eventRepo.increment(restaurant.id, date, type);
    return ok({ ok: true });
  }
}
