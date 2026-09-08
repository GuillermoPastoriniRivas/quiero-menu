import { StorefrontEventType } from '../enums/storefront-event-type.enum.js';

export interface EventTypeCount {
  whatsapp: number;
  maps: number;
  instagram: number;
}

export interface StorefrontEventRepository {
  increment(
    restaurantId: string,
    date: string,
    type: StorefrontEventType,
  ): Promise<void>;
  countByType(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<EventTypeCount>;
  deleteManyByRestaurantId(restaurantId: string): Promise<void>;
}
