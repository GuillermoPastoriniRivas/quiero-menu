import { StorefrontEventType } from '../enums/storefront-event-type.enum.js';

export class StorefrontEvent {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    /** Fecha local del restaurante en formato YYYY-MM-DD. */
    public readonly date: string,
    public readonly type: StorefrontEventType,
    public readonly count: number,
  ) {}
}
