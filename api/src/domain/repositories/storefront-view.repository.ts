export interface StorefrontViewRepository {
  increment(restaurantId: string, date: string): Promise<void>;
  countViews(restaurantId: string, since: Date, to: Date): Promise<number>;
}
