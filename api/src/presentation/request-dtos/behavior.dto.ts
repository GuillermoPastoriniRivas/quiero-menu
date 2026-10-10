import { z } from 'zod';

export const CHANNELS = [
  'direct',
  'qr',
  'ig',
  'wa',
  'dir',
  'powered',
  'google',
  'referral',
  'campaign',
  'unknown',
] as const;
const tag = z
  .string()
  .max(80)
  .regex(/^[\p{L}\p{N} _.-]*$/u);

// Only route templates are stored, never tracking/invitation/reset tokens or queries.
export function safeAnalyticsPath(path: string): string {
  return path
    .split('?')[0]
    .replace(/\/(tracking|invitacion|kitchen|delivery)\/[^/]+/g, '/$1/:token')
    .slice(0, 120);
}

export const BehaviorContextSchema = z.object({
  visitorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  channel: z.enum(CHANNELS),
  firstChannel: z.enum(CHANNELS).optional(),
  referrerHost: z
    .string()
    .max(100)
    .regex(/^[a-z0-9.-]+$/i)
    .optional(),
  utmSource: tag.optional(),
  utmMedium: tag.optional(),
  utmCampaign: tag.optional(),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  path: z
    .string()
    .max(300)
    .startsWith('/')
    .transform(safeAnalyticsPath)
    .optional(),
});

export const PUBLIC_EVENTS = [
  'landing_view',
  'signup_started',
  'directory_view',
  'directory_search',
  'directory_result_click',
  'powered_click',
  'onboarding_started',
  'onboarding_step',
] as const;
export const DINER_EVENTS = [
  'storefront_view',
  'category_view',
  'item_view',
  'item_add',
  'item_remove',
  'cart_view',
  'checkout_start',
  'checkout_exit',
  'checkout_error',
  'menu_search',
  'contact_click',
  'repeat_order',
  'claim_view',
  'claim_click',
] as const;
export const OWNER_EVENTS = [
  'owner_page_view',
  'owner_engaged',
  'link_shared',
  'qr_downloaded',
  'qr_printed',
  'onboarding_started',
  'onboarding_step',
  'feature_view',
] as const;
export const TRACKING_EVENTS = [
  'tracking_view',
  'tracking_contact_click',
  'receipt_uploaded',
  'coupon_copied',
  'push_enabled',
] as const;

export function sanitizeSearch(query: string): string {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  return /@|https?:|\d{5,}/i.test(normalized)
    ? '[redacted]'
    : normalized.slice(0, 64);
}

// Strip unknown keys: names, addresses, notes, phones, tokens and URLs are never accepted.
export const BehaviorPropertiesSchema = z.object({
  itemId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  categoryId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  quantity: z.number().int().min(0).max(999).optional(),
  value: z.number().min(0).max(1e10).optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  resultsCount: z.number().int().min(0).max(10000).optional(),
  query: z.string().max(200).transform(sanitizeSearch).optional(),
  city: z
    .string()
    .max(80)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
  category: z
    .string()
    .max(40)
    .regex(/^[a-z0-9_-]*$/)
    .optional(),
  contact: z.enum(['whatsapp', 'maps', 'instagram']).optional(),
  method: z.enum(['copy', 'whatsapp', 'native', 'instagram']).optional(),
  reason: z
    .enum(['validation', 'network', 'server', 'closed', 'unavailable'])
    .optional(),
  step: z.number().int().min(0).max(20).optional(),
  feature: z
    .enum(['sharing', 'appearance', 'billing', 'menu', 'orders', 'analytics'])
    .optional(),
  isOpen: z.boolean().optional(),
  claimed: z.boolean().optional(),
});

export const BehaviorBatchSchema = z.object({
  context: BehaviorContextSchema,
  events: z
    .array(
      z.object({
        eventId: z.string().uuid(),
        event: z.enum([
          ...PUBLIC_EVENTS,
          ...DINER_EVENTS,
          ...OWNER_EVENTS,
          ...TRACKING_EVENTS,
        ]),
        occurredAt: z.iso.datetime(),
        properties: BehaviorPropertiesSchema.default({}),
      }),
    )
    .min(1)
    .max(20),
});
export type BehaviorBatch = z.infer<typeof BehaviorBatchSchema>;

export const BehaviorQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((d) => [7, 30, 90].includes(d))
    .default(30),
  restaurantId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
});
