import { z } from 'zod';
import { RestaurantCategory } from '../../domain/enums/restaurant-category.enum.js';

export const AdminSearchRequestSchema = z.object({
  q: z.string().max(120).optional().default(''),
});
export type AdminSearchRequestDto = z.infer<typeof AdminSearchRequestSchema>;

export const AdminCreateRestaurantRequestSchema = z.object({
  ownerName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  restaurantName: z.string().min(1).max(120),
  restaurantSlug: z
    .string()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens',
    ),
  city: z.string().max(80).optional(),
  category: z.nativeEnum(RestaurantCategory).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
  sendOwnerEmails: z.boolean().optional(),
});
export type AdminCreateRestaurantRequestDto = z.infer<
  typeof AdminCreateRestaurantRequestSchema
>;

export const AdminAuditLogsRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
export type AdminAuditLogsRequestDto = z.infer<
  typeof AdminAuditLogsRequestSchema
>;
