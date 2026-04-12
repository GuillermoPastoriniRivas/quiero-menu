import { z } from 'zod';

const MenuVisionItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  basePrice: z.number().min(0),
  itemType: z.enum(['simple', 'variant', 'combo']).default('simple'),
  variants: z.array(z.object({
    name: z.string().min(1),
    priceOverride: z.number().nullable().default(null),
  })).optional(),
  options: z.array(z.object({
    name: z.string().min(1),
    priceDelta: z.number().default(0),
    optionGroup: z.string().min(1),
  })).optional(),
});

const MenuVisionCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  items: z.array(MenuVisionItemSchema),
});

export const ImportMenuRequestSchema = z.object({
  restaurant: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    currency: z.string().optional(),
  }).default({}),
  operatingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    opensAt: z.string(),
    closesAt: z.string(),
    isClosed: z.boolean().default(false),
  })).optional(),
  categories: z.array(MenuVisionCategorySchema).min(1),
});
export type ImportMenuRequestDto = z.infer<typeof ImportMenuRequestSchema>;
