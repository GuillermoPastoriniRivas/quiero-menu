import { Subscription } from '../entities/subscription.entity.js';

export interface SubscriptionRepository {
  findByRestaurantId(restaurantId: string): Promise<Subscription | null>;
  findByExternalSubscriptionId(externalSubscriptionId: string): Promise<Subscription | null>;
  create(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription>;
  update(id: string, data: Partial<Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Subscription | null>;
}
