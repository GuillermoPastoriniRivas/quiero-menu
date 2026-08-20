import { z } from 'zod';

const PushSubscriptionSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const SubscribeStaffRequestSchema = z.object({
  subscription: PushSubscriptionSchema,
});
export type SubscribeStaffRequestDto = z.infer<
  typeof SubscribeStaffRequestSchema
>;

export const SubscribeOrderRequestSchema = z.object({
  orderCode: z.string().min(1),
  slug: z.string().min(1),
  subscription: PushSubscriptionSchema,
});
export type SubscribeOrderRequestDto = z.infer<
  typeof SubscribeOrderRequestSchema
>;

export const UnsubscribeRequestSchema = z.object({
  endpoint: z.string().min(1),
});
export type UnsubscribeRequestDto = z.infer<typeof UnsubscribeRequestSchema>;
