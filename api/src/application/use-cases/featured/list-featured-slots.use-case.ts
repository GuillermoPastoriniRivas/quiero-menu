import { FeaturedSlotRepository } from '../../../domain/repositories/featured-slot.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import type { FeaturedScope } from '../../../domain/entities/featured-slot.entity.js';

export interface FeaturedSlotListItem {
  id: string;
  scope: FeaturedScope;
  citySlug: string;
  category: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  restaurant: { id: string; slug: string; name: string } | null;
}

export class ListFeaturedSlotsUseCase {
  constructor(
    private readonly slotRepo: FeaturedSlotRepository,
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(): Promise<FeaturedSlotListItem[]> {
    const slots = await this.slotRepo.listActive(new Date());
    const items: FeaturedSlotListItem[] = [];
    for (const slot of slots) {
      const restaurant = await this.restaurantRepo.findById(slot.restaurantId);
      items.push({
        id: slot.id,
        scope: slot.scope,
        citySlug: slot.citySlug,
        category: slot.category,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        isActive: slot.isActive,
        restaurant: restaurant
          ? { id: restaurant.id, slug: restaurant.slug, name: restaurant.name }
          : null,
      });
    }
    return items;
  }
}
