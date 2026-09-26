import type {
  CityFacet,
  RestaurantInsightsQuery,
} from '../../ports/restaurant-insights.port.js';
import {
  ADMIN_STAGES,
  AdminRestaurantIndex,
  demandScore,
  toListItem,
  type AdminIndexRow,
  type AdminRestaurantListItem,
  type AdminStage,
} from './admin-restaurant-index.js';

export const ADMIN_LIST_SORTS = [
  'recent',
  'demand',
  'readiness',
  'name',
] as const;
export type AdminListSort = (typeof ADMIN_LIST_SORTS)[number];

export interface ListAdminRestaurantsInput {
  q?: string;
  stage?: AdminStage;
  citySlug?: string;
  category?: string;
  sort?: AdminListSort;
  page?: number;
  limit?: number;
}

export interface ListAdminRestaurantsOutput {
  items: AdminRestaurantListItem[];
  total: number;
  page: number;
  pages: number;
  stages: Record<AdminStage | 'all', number>;
  cities: CityFacet[];
}

const COMPARATORS: Record<
  AdminListSort,
  (a: AdminIndexRow, b: AdminIndexRow) => number
> = {
  recent: (a, b) =>
    b.restaurant.createdAt.getTime() - a.restaurant.createdAt.getTime(),
  demand: (a, b) =>
    demandScore(b.demand30d) - demandScore(a.demand30d) ||
    b.orders30d - a.orders30d ||
    b.listing.percent - a.listing.percent,
  readiness: (a, b) =>
    b.listing.percent - a.listing.percent ||
    demandScore(b.demand30d) - demandScore(a.demand30d),
  name: (a, b) => a.restaurant.name.localeCompare(b.restaurant.name, 'es'),
};

export class ListAdminRestaurantsUseCase {
  constructor(
    private readonly index: AdminRestaurantIndex,
    private readonly insights: RestaurantInsightsQuery,
  ) {}

  async execute(
    input: ListAdminRestaurantsInput,
  ): Promise<ListAdminRestaurantsOutput> {
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    const [rows, cities] = await Promise.all([
      this.index.search({
        term: input.q,
        citySlug: input.citySlug,
        category: input.category,
      }),
      this.insights.cities(),
    ]);

    const stages = Object.fromEntries(
      [...ADMIN_STAGES, 'all'].map((stage) => [stage, 0]),
    ) as Record<AdminStage | 'all', number>;
    for (const row of rows) {
      stages[row.stage] += 1;
      stages.all += 1;
    }

    const filtered = input.stage
      ? rows.filter((row) => row.stage === input.stage)
      : rows;
    const sorted = [...filtered].sort(COMPARATORS[input.sort ?? 'recent']);
    const total = sorted.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(input.page ?? 1, 1), pages);
    const items = sorted
      .slice((page - 1) * limit, page * limit)
      .map(toListItem);

    return { items, total, page, pages, stages, cities };
  }
}
