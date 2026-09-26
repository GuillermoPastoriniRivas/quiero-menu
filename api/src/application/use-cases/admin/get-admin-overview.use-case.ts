import type { RestaurantInsightsQuery } from '../../ports/restaurant-insights.port.js';
import {
  ADMIN_STAGES,
  AdminRestaurantIndex,
  demandScore,
  toListItem,
  type AdminIndexRow,
  type AdminRestaurantListItem,
  type AdminStage,
} from './admin-restaurant-index.js';
import { describeActivity, type AdminActivityEntry } from './admin-activity.js';

const DAY_MS = 86_400_000;
const LIST_SIZE = 6;
const EXPIRING_WINDOW_DAYS = 3;
const NEARLY_READY_PERCENT = 60;

export interface AdminOverviewOutput {
  generatedAt: Date;
  pipeline: Record<AdminStage | 'all', number>;
  inventory: {
    withMenu: number;
    listingReady: number;
    ordersWithoutOwner: number;
  };
  platform: {
    ordersLast7d: number;
    ordersPrev7d: number;
    activeRestaurants7d: number;
  };
  pendingClaims: number;
  lists: {
    expiringInvitations: AdminRestaurantListItem[];
    readyToInvite: AdminRestaurantListItem[];
    hotLeads: AdminRestaurantListItem[];
    stalledOwners: AdminRestaurantListItem[];
    ordersWithoutOwner: AdminRestaurantListItem[];
  };
  activity: AdminActivityEntry[];
}

function top(
  rows: AdminIndexRow[],
  predicate: (row: AdminIndexRow) => boolean,
  compare: (a: AdminIndexRow, b: AdminIndexRow) => number,
): AdminRestaurantListItem[] {
  return rows
    .filter(predicate)
    .sort(compare)
    .slice(0, LIST_SIZE)
    .map(toListItem);
}

export class GetAdminOverviewUseCase {
  constructor(
    private readonly index: AdminRestaurantIndex,
    private readonly insights: RestaurantInsightsQuery,
  ) {}

  async execute(now: Date = new Date()): Promise<AdminOverviewOutput> {
    const last7 = new Date(now.getTime() - 7 * DAY_MS);
    const prev7 = new Date(now.getTime() - 14 * DAY_MS);
    const [rows, current, previous, pendingClaims, recent] = await Promise.all([
      this.index.search({}, now),
      this.insights.platformOrders(last7, now),
      this.insights.platformOrders(prev7, last7),
      this.insights.pendingClaimsCount(),
      this.insights.timeline(null, 120),
    ]);

    const pipeline = Object.fromEntries(
      [...ADMIN_STAGES, 'all'].map((stage) => [stage, 0]),
    ) as Record<AdminStage | 'all', number>;
    for (const row of rows) {
      pipeline[row.stage] += 1;
      pipeline.all += 1;
    }

    const expiringLimit = now.getTime() + EXPIRING_WINDOW_DAYS * DAY_MS;
    const byDemand = (a: AdminIndexRow, b: AdminIndexRow) =>
      demandScore(b.demand30d) - demandScore(a.demand30d);

    const restaurantsById = new Map(
      rows.map((row) => [
        row.restaurant.id,
        {
          id: row.restaurant.id,
          name: row.restaurant.name,
          slug: row.restaurant.slug,
        },
      ]),
    );

    return {
      generatedAt: now,
      pipeline,
      inventory: {
        withMenu: rows.filter((row) => row.menuItems > 0).length,
        listingReady: rows.filter((row) => row.listing.percent === 100).length,
        ordersWithoutOwner: rows.filter((row) => row.ordersWithoutOwner).length,
      },
      platform: {
        ordersLast7d: current.orders,
        ordersPrev7d: previous.orders,
        activeRestaurants7d: current.restaurants,
      },
      pendingClaims,
      lists: {
        expiringInvitations: top(
          rows,
          (row) =>
            row.stage === 'invitado' &&
            row.invitation !== null &&
            row.invitation.expiresAt.getTime() <= expiringLimit,
          (a, b) =>
            a.invitation!.expiresAt.getTime() -
            b.invitation!.expiresAt.getTime(),
        ),
        readyToInvite: top(
          rows,
          (row) =>
            row.stage === 'ficha' &&
            row.listing.percent >= NEARLY_READY_PERCENT,
          (a, b) => b.listing.percent - a.listing.percent || byDemand(a, b),
        ),
        hotLeads: top(
          rows,
          (row) =>
            (row.stage === 'ficha' || row.stage === 'invitado') &&
            demandScore(row.demand30d) > 0,
          byDemand,
        ),
        stalledOwners: top(
          rows,
          (row) => row.stage === 'activo' && row.orders30d === 0,
          (a, b) => a.activation.percent - b.activation.percent,
        ),
        ordersWithoutOwner: top(
          rows,
          (row) => row.ordersWithoutOwner,
          byDemand,
        ),
      },
      activity: await describeActivity(
        this.insights,
        recent,
        restaurantsById,
        12,
      ),
    };
  }
}
