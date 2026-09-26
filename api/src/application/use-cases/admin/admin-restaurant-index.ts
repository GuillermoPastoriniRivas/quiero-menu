import type { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import {
  ACTIVATION_STEPS,
  LISTING_STEPS,
  evaluateReadiness,
  summarizeReadiness,
  type ReadinessChecks,
  type ReadinessSummary,
} from '../../../domain/services/restaurant-readiness.js';
import type {
  InsightDemand,
  InsightInvitation,
  InsightOwner,
  InsightSubscription,
  RestaurantInsightsQuery,
  RestaurantSearchFilter,
} from '../../ports/restaurant-insights.port.js';

export const ADMIN_STAGES = [
  'ficha',
  'invitado',
  'activo',
  'pro',
  'pausado',
] as const;
export type AdminStage = (typeof ADMIN_STAGES)[number];

const DAY_MS = 86_400_000;
const MAX_CANDIDATES = 2000;

export interface AdminIndexRow {
  restaurant: Restaurant;
  stage: AdminStage;
  owner: InsightOwner | null;
  subscription: InsightSubscription | null;
  invitation: InsightInvitation | null;
  menuItems: number;
  openDays: number;
  checks: ReadinessChecks;
  listing: ReadinessSummary;
  activation: ReadinessSummary;
  demand30d: InsightDemand;
  orders30d: number;
  ordersWithoutOwner: boolean;
}

export function stageOf(
  restaurant: Pick<Restaurant, 'status'>,
  owner: InsightOwner | null,
  subscription: InsightSubscription | null,
  invitation: InsightInvitation | null,
): AdminStage {
  if (restaurant.status !== RestaurantStatus.ACTIVE) return 'pausado';
  if (!owner) return invitation ? 'invitado' : 'ficha';
  const proPlan: string = PlanTier.PRO;
  const activeStatus: string = SubscriptionStatus.ACTIVE;
  if (subscription?.plan === proPlan && subscription.status === activeStatus) {
    return 'pro';
  }
  return 'activo';
}

export function demandScore(demand: InsightDemand): number {
  return (
    demand.whatsapp * 5 + demand.maps * 2 + demand.instagram * 2 + demand.views
  );
}

const EMPTY_DEMAND: InsightDemand = {
  views: 0,
  whatsapp: 0,
  maps: 0,
  instagram: 0,
};

export class AdminRestaurantIndex {
  constructor(private readonly insights: RestaurantInsightsQuery) {}

  async search(
    filter: Omit<RestaurantSearchFilter, 'ownerMatchIds'>,
    now: Date = new Date(),
  ): Promise<AdminIndexRow[]> {
    const term = filter.term?.trim() ?? '';
    const ownerMatchIds =
      term.length >= 3
        ? await this.insights.restaurantIdsByOwnerEmail(term, 50)
        : [];
    const restaurants = await this.insights.findRestaurants(
      { ...filter, term, ownerMatchIds },
      MAX_CANDIDATES,
    );
    return this.rowsFor(restaurants, now);
  }

  async rowsFor(
    restaurants: Restaurant[],
    now: Date = new Date(),
  ): Promise<AdminIndexRow[]> {
    if (restaurants.length === 0) return [];
    const ids = restaurants.map((r) => r.id);
    const since30d = new Date(now.getTime() - 30 * DAY_MS);
    const [
      owners,
      subscriptions,
      invitations,
      items,
      days,
      demand,
      orders,
      lifetimeOrders,
    ] = await Promise.all([
      this.insights.owners(ids),
      this.insights.subscriptions(ids),
      this.insights.openInvitations(ids, now),
      this.insights.menuItemCounts(ids),
      this.insights.openDayCounts(ids),
      this.insights.demand(ids, since30d, now),
      this.insights.orderCounts(ids, since30d),
      this.insights.orderCounts(ids, new Date(0)),
    ]);

    return restaurants.map((restaurant) => {
      const owner = owners.get(restaurant.id) ?? null;
      const subscription = subscriptions.get(restaurant.id) ?? null;
      const invitation = invitations.get(restaurant.id) ?? null;
      const menuItems = items.get(restaurant.id) ?? 0;
      const openDays = days.get(restaurant.id) ?? 0;
      const checks = evaluateReadiness({
        restaurant,
        menuItems,
        openDays,
        orders: lifetimeOrders.get(restaurant.id) ?? 0,
      });
      return {
        restaurant,
        stage: stageOf(restaurant, owner, subscription, invitation),
        owner,
        subscription,
        invitation,
        menuItems,
        openDays,
        checks,
        listing: summarizeReadiness(checks, LISTING_STEPS),
        activation: summarizeReadiness(checks, ACTIVATION_STEPS),
        demand30d: demand.get(restaurant.id) ?? EMPTY_DEMAND,
        orders30d: orders.get(restaurant.id) ?? 0,
        ordersWithoutOwner:
          !owner &&
          restaurant.claimed !== false &&
          restaurant.status === RestaurantStatus.ACTIVE,
      };
    });
  }
}

export interface AdminRestaurantListItem {
  id: string;
  slug: string;
  name: string;
  city: string;
  citySlug: string;
  category: string;
  logoUrl: string;
  status: string;
  claimed: boolean;
  stage: AdminStage;
  createdAt: Date;
  owner: { name: string; email: string } | null;
  plan: string | null;
  invitation: { expiresAt: Date; email: string | null } | null;
  menuItems: number;
  listing: ReadinessSummary;
  activation: ReadinessSummary;
  demand30d: InsightDemand;
  orders30d: number;
  ordersWithoutOwner: boolean;
}

export function toListItem(row: AdminIndexRow): AdminRestaurantListItem {
  const r = row.restaurant;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city,
    citySlug: r.citySlug ?? '',
    category: r.category ?? '',
    logoUrl: r.logoUrl,
    status: r.status,
    claimed: r.claimed !== false,
    stage: row.stage,
    createdAt: r.createdAt,
    owner: row.owner ? { name: row.owner.name, email: row.owner.email } : null,
    plan: row.subscription?.plan ?? null,
    invitation: row.invitation
      ? { expiresAt: row.invitation.expiresAt, email: row.invitation.email }
      : null,
    menuItems: row.menuItems,
    listing: row.listing,
    activation: row.activation,
    demand30d: row.demand30d,
    orders30d: row.orders30d,
    ordersWithoutOwner: row.ordersWithoutOwner,
  };
}
