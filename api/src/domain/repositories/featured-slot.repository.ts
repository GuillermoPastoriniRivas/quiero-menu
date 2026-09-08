import {
  FeaturedSlot,
  FeaturedScope,
} from '../entities/featured-slot.entity.js';

export interface CreateFeaturedSlotData {
  restaurantId: string;
  scope: FeaturedScope;
  citySlug: string;
  category: string;
  startsAt: Date;
  endsAt: Date;
}

export interface FeaturedSlotRepository {
  create(data: CreateFeaturedSlotData): Promise<FeaturedSlot>;
  findById(id: string): Promise<FeaturedSlot | null>;
  /** Slots vigentes ahora (para ordenar el directorio). */
  listActive(now: Date): Promise<FeaturedSlot[]>;
  listByRestaurantId(restaurantId: string): Promise<FeaturedSlot[]>;
  /** Vigentes para un scope, para hacer cumplir el cupo. */
  countActiveScope(
    scope: FeaturedScope,
    citySlug: string,
    category: string,
    now: Date,
  ): Promise<number>;
  setActive(id: string, isActive: boolean): Promise<FeaturedSlot | null>;
}
