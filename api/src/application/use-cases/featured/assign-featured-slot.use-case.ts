import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { FeaturedSlotRepository } from '../../../domain/repositories/featured-slot.repository.js';
import { FeaturedScope } from '../../../domain/entities/featured-slot.entity.js';
import { Result, ok, err } from '../../common/result.js';
import {
  RestaurantNotFoundError,
  RestaurantNotFeatureableError,
  FeaturedSlotFullError,
} from '../../../domain/errors/domain-errors.js';

export const MAX_CATEGORY_SLOTS = 3;
export const MAX_HOME_SLOTS = 3;

export interface AssignFeaturedSlotInput {
  restaurantId: string;
  scope: FeaturedScope;
  days: number;
}

/**
 * Asigna un lugar destacado con cupo cerrado: la escasez es el producto
 * ("hay dos lugares"). Máx 3 por rubro+ciudad y 3 en home por ciudad.
 * Los slots vencidos liberan el cupo solos (endsAt).
 */
export class AssignFeaturedSlotUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly slotRepo: FeaturedSlotRepository,
  ) {}

  async execute(
    input: AssignFeaturedSlotInput,
  ): Promise<
    Result<
      { slotId: string; endsAt: Date },
      | RestaurantNotFoundError
      | RestaurantNotFeatureableError
      | FeaturedSlotFullError
    >
  > {
    const restaurant = await this.restaurantRepo.findById(input.restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const citySlug = restaurant.citySlug ?? '';
    const category = restaurant.category ?? '';
    if (!citySlug || (input.scope === 'category' && !category)) {
      return err(new RestaurantNotFeatureableError());
    }

    const max =
      input.scope === 'category' ? MAX_CATEGORY_SLOTS : MAX_HOME_SLOTS;
    const used = await this.slotRepo.countActiveScope(
      input.scope,
      citySlug,
      category,
      new Date(),
    );
    if (used >= max) return err(new FeaturedSlotFullError());

    const days = Math.min(Math.max(Math.floor(input.days) || 30, 1), 365);
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000);
    const slot = await this.slotRepo.create({
      restaurantId: restaurant.id,
      scope: input.scope,
      citySlug,
      category: input.scope === 'category' ? category : '',
      startsAt,
      endsAt,
    });
    return ok({ slotId: slot.id, endsAt: slot.endsAt });
  }
}
