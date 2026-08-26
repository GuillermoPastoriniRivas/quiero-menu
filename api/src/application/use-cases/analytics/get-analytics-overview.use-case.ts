import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import {
  AnalyticsRepository,
  StageTiming,
} from '../../../domain/repositories/analytics.repository.js';
import { StorefrontViewRepository } from '../../../domain/repositories/storefront-view.repository.js';

export type AnalyticsRange = 'today' | '7' | '30';

function zonedOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }
  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour === '24' ? '00' : values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return asUTC - date.getTime();
}

function startOfZonedDay(date: Date, timeZone: string): Date {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // formato en-US: MM/DD/YYYY
  const [month, day, year] = dtf.format(date).split('/');
  const midnightLocal = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const offset = zonedOffsetMs(new Date(midnightLocal), timeZone);
  return new Date(midnightLocal - offset);
}

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
  timings: StageTiming[];
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

    const now = new Date();
    let since: Date;
    let prevSince: Date;
    let rangeDays: number;

    if (range === 'today') {
      since = startOfZonedDay(now, timezone);
      // El período anterior compara contra una ventana de igual duración que terminó a medianoche
      prevSince = new Date(since.getTime() - (now.getTime() - since.getTime()));
      rangeDays = 1;
    } else {
      const days = range === '30' ? 30 : 7;
      since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);
      rangeDays = days;
    }

    const [
      summary,
      prevSummary,
      views,
      daily,
      topItems,
      byHour,
      status,
      timings,
    ] = await Promise.all([
      this.analyticsRepo.getSummary(restaurantId, since, now),
      this.analyticsRepo.getSummary(restaurantId, prevSince, since),
      this.viewRepo.countViews(restaurantId, since, now),
      this.analyticsRepo.getDailySales(restaurantId, since, now, timezone),
      this.analyticsRepo.getTopItems(restaurantId, since, now, 10),
      this.analyticsRepo.getSalesByHour(restaurantId, since, now, timezone),
      this.analyticsRepo.getStatusDistribution(restaurantId, since, now),
      this.analyticsRepo.getStatusTimings(restaurantId, since, now),
    ]);

    const conversionRate = views > 0 ? (summary.orders / views) * 100 : 0;
    const cancelledRate =
      summary.orders > 0 ? (summary.cancelled / summary.orders) * 100 : 0;

    return {
      range: rangeDays,
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
      timings,
    };
  }
}
