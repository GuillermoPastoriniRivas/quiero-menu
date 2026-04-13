import { z } from 'zod';
import { RestaurantStatus } from '../../domain/enums/restaurant-status.enum.js';

export const UpdateRestaurantRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  status: z.nativeEnum(RestaurantStatus).optional(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
  }).nullable().optional(),
});
export type UpdateRestaurantRequestDto = z.infer<typeof UpdateRestaurantRequestSchema>;

export const UpdateOperatingHoursRequestSchema = z.object({
  hours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    opensAt: z.string(),
    closesAt: z.string(),
    isClosed: z.boolean(),
  })),
});
export type UpdateOperatingHoursRequestDto = z.infer<typeof UpdateOperatingHoursRequestSchema>;
