export interface SalesSummary {
  revenue: number;
  orders: number;
  avgTicket: number;
  cancelled: number;
}

export interface DailySalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface HourlySalesPoint {
  hour: number;
  orders: number;
  revenue: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface StageTiming {
  from: string;
  to: string;
  count: number;
  avgMinutes: number;
  minMinutes: number;
  maxMinutes: number;
}

export interface AnalyticsRepository {
  getSummary(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<SalesSummary>;
  getDailySales(
    restaurantId: string,
    since: Date,
    to: Date,
    timezone: string,
  ): Promise<DailySalesPoint[]>;
  getTopItems(
    restaurantId: string,
    since: Date,
    to: Date,
    limit: number,
  ): Promise<TopItem[]>;
  getSalesByHour(
    restaurantId: string,
    since: Date,
    to: Date,
    timezone: string,
  ): Promise<HourlySalesPoint[]>;
  getStatusDistribution(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<StatusCount[]>;
  getStatusTimings(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<StageTiming[]>;
}
