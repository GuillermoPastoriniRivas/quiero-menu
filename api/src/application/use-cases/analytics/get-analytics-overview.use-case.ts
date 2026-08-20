import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { AnalyticsRepository } from '../../../domain/repositories/analytics.repository.js';
import { StorefrontViewRepository } from '../../../domain/repositories/storefront-view.repository.js';

export type AnalyticsRange = '7' | '30';

export interface AnalyticsOverview {
  range: number;
  summary: {
    revenue: number;
    orders: number;
    avgTicket: number;
    cancelled: number;
    cancelledRate: number;
    views: number;
    conversionRate: number;
  };
  deltas: {
    revenue: number;
    orders: number;
  };
  daily: { date: string; revenue: number; orders: number }[];
  topItems: {
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  byHour: { hour: number; orders: number; revenue: number }[];
  status: { status: string; count: number }[];
}

export class GetAnalyticsOverviewUseCase {
  constructor(
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly viewRepo: StorefrontViewRepository,
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(
    restaurantId: string,
    range: AnalyticsRange = '7',
  ): Promise<AnalyticsOverview> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    const timezone = restaurant?.timezone || 'UTC';

    const days = range === '30' ? 30 : 7;
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);

    const [summary, prevSummary, views, daily, topItems, byHour, status] =
      await Promise.all([
        this.analyticsRepo.getSummary(restaurantId, since, now),
        this.analyticsRepo.getSummary(restaurantId, prevSince, since),
        this.viewRepo.countViews(restaurantId, since, now),
        this.analyticsRepo.getDailySales(restaurantId, since, now, timezone),
        this.analyticsRepo.getTopItems(restaurantId, since, now, 10),
        this.analyticsRepo.getSalesByHour(restaurantId, since, now, timezone),
        this.analyticsRepo.getStatusDistribution(restaurantId, since, now),
      ]);

    const conversionRate = views > 0 ? (summary.orders / views) * 100 : 0;
    const cancelledRate =
      summary.orders > 0 ? (summary.cancelled / summary.orders) * 100 : 0;

    return {
      range: days,
      summary: {
        revenue: summary.revenue,
        orders: summary.orders,
        avgTicket: summary.avgTicket,
        cancelled: summary.cancelled,
        cancelledRate,
        views,
        conversionRate,
      },
      deltas: {
        revenue:
          prevSummary.revenue > 0
            ? ((summary.revenue - prevSummary.revenue) / prevSummary.revenue) *
              100
            : summary.revenue > 0
              ? 100
              : 0,
        orders:
          prevSummary.orders > 0
            ? ((summary.orders - prevSummary.orders) / prevSummary.orders) * 100
            : summary.orders > 0
              ? 100
              : 0,
      },
      daily,
      topItems,
      byHour,
      status,
    };
  }
}
