export interface FunnelStep { event: string; count: number; fromPrevious: number | null }
export interface OwnerCohort {
  _id: string; accounts: number; eligible14: number; activated14: number;
  eligible30: number; retained30: number; eligible60: number; retained60: number; eligible90: number; retained90: number;
}
export interface BehaviorReport {
  days: number; since: string; until: string; timezone: string; rawRetentionDays: number;
  totals: {
    events: { _id: string; count: number }[];
    sources: { _id: { channel: string; audience: string }; count: number; views: number; orders: number }[];
    devices: { _id: string; count: number }[];
    coverage: { earliest: string; events: number }[];
  };
  orders: { orders: number; delivered: number; cancelled: number; attributed: number; completedLast7?: number };
  dinerFunnel: FunnelStep[];
  byChannel: { channel: string; stages: FunnelStep[] }[];
  checkoutDropoff: number;
  owners: {
    funnel: { registered: number; verified: number; menu: number; shared: number; firstOrder: number; subscribed: number; paid: number }[];
    cohorts: OwnerCohort[];
    accounts: { restaurantId: string; name?: string; slug?: string; first: Record<string, string>; acquisitionChannel?: string; lastActiveAt?: string; firstOrderAt?: string }[];
  };
  customerCohortDays: number;
  customerCohorts: { _id: string; customers: number; eligible30: number; repeated30: number }[];
  daily: { _id: string; count: number }[];
  products: { restaurantId: string; itemId: string; name?: string; views: number; adds: number }[];
  searches: { _id: { query: string; city?: string; scope: string }; count: number; zeroResults: number }[];
}
