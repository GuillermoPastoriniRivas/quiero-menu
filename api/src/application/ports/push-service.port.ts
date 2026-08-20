export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushServicePort {
  getVapidPublicKey(): string;
  subscribeStaff(
    userId: string,
    restaurantId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ): Promise<void>;
  subscribeOrder(
    orderCode: string,
    slug: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ): Promise<void>;
  unsubscribe(endpoint: string): Promise<void>;
  sendToRestaurant(restaurantId: string, payload: PushPayload): Promise<void>;
  sendToOrder(orderCode: string, payload: PushPayload): Promise<void>;
}
