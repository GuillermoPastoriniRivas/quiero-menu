import { RestaurantStatus } from '../enums/restaurant-status.enum.js';

export class Restaurant {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string,
    public readonly description: string,
    public readonly logoUrl: string,
    public readonly bannerUrl: string,
    public readonly address: string,
    public readonly city: string,
    public readonly country: string,
    public readonly coordinates: { lat: number; lng: number } | null,
    public readonly phone: string,
    public readonly timezone: string,
    public readonly currency: string,
    public readonly status: RestaurantStatus,
    public readonly customDomain: string | null,
    public readonly socialLinks: { instagram?: string; facebook?: string; tiktok?: string } | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
