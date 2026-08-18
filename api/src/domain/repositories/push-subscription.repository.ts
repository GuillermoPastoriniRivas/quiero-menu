import { PushSubscription } from '../entities/push-subscription.entity.js';

export interface CreatePushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId: string | null;
  restaurantId: string | null;
  orderCode: string | null;
  orderSlug: string | null;
}

export interface PushSubscriptionRepository {
  create(data: CreatePushSubscriptionData): Promise<PushSubscription>;
  findByEndpoint(endpoint: string): Promise<PushSubscription | null>;
  deleteByEndpoint(endpoint: string): Promise<boolean>;
  findByRestaurantId(restaurantId: string): Promise<PushSubscription[]>;
  findByOrderCode(orderCode: string): Promise<PushSubscription[]>;
}