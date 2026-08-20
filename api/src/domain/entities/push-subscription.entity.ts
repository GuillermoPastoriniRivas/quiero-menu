export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export class PushSubscription {
  constructor(
    public readonly id: string,
    public readonly endpoint: string,
    public readonly keys: PushSubscriptionKeys,
    public readonly userId: string | null,
    public readonly restaurantId: string | null,
    public readonly orderCode: string | null,
    public readonly orderSlug: string | null,
    public readonly createdAt: Date,
  ) {}
}
