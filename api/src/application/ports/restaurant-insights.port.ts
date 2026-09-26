import type { Restaurant } from '../../domain/entities/restaurant.entity.js';
import type { AuditLogEntry } from '../../domain/entities/audit-log.entity.js';

export interface RestaurantSearchFilter {
  term?: string;
  citySlug?: string;
  category?: string;
  ownerMatchIds?: string[];
}

export interface InsightOwner {
  userId: string;
  name: string;
  email: string;
}

export interface InsightSubscription {
  plan: string;
  status: string;
}

export interface InsightInvitation {
  id: string;
  email: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface InsightDemand {
  views: number;
  whatsapp: number;
  maps: number;
  instagram: number;
}

export interface CityFacet {
  citySlug: string;
  city: string;
  count: number;
}

export interface RestaurantInsightsQuery {
  findRestaurants(
    filter: RestaurantSearchFilter,
    limit: number,
  ): Promise<Restaurant[]>;
  restaurantIdsByOwnerEmail(term: string, limit: number): Promise<string[]>;
  owners(restaurantIds: string[]): Promise<Map<string, InsightOwner>>;
  subscriptions(
    restaurantIds: string[],
  ): Promise<Map<string, InsightSubscription>>;
  openInvitations(
    restaurantIds: string[],
    now: Date,
  ): Promise<Map<string, InsightInvitation>>;
  menuItemCounts(restaurantIds: string[]): Promise<Map<string, number>>;
  openDayCounts(restaurantIds: string[]): Promise<Map<string, number>>;
  demand(
    restaurantIds: string[],
    since: Date,
    to: Date,
  ): Promise<Map<string, InsightDemand>>;
  orderCounts(
    restaurantIds: string[],
    since: Date,
  ): Promise<Map<string, number>>;
  platformOrders(
    since: Date,
    to: Date,
  ): Promise<{ orders: number; restaurants: number }>;
  pendingClaimsCount(): Promise<number>;
  cities(): Promise<CityFacet[]>;
  timeline(
    restaurantId: string | null,
    limit: number,
  ): Promise<AuditLogEntry[]>;
  users(
    userIds: string[],
  ): Promise<Map<string, { name: string; email: string }>>;
  restaurantLabels(
    restaurantIds: string[],
  ): Promise<Map<string, { id: string; name: string; slug: string }>>;
}
