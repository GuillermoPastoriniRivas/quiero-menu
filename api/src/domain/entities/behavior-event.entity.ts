export interface BehaviorContext {
  visitorId: string;
  sessionId: string;
  channel: string;
  firstChannel?: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  path?: string;
}

export interface BehaviorEvent {
  eventId: string;
  event: string;
  occurredAt: Date;
  receivedAt: Date;
  audience: 'acquisition' | 'diner' | 'owner';
  source: 'client' | 'server';
  restaurantId?: string;
  actorUserId?: string;
  context?: BehaviorContext;
  properties: Record<string, string | number | boolean>;
}

export interface BehaviorQuery {
  days: number;
  restaurantId?: string;
}
