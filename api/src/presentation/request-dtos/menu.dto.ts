import { z } from 'zod';
import { MenuItemType } from '../../domain/enums/menu-item-type.enum.js';

export const CreateCategoryRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  isVisible: z.boolean().optional().default(true),
});
export type CreateCategoryRequestDto = z.infer<typeof CreateCategoryRequestSchema>;

export const UpdateCategoryRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isVisible: z.boolean().optional(),
});
export type UpdateCategoryRequestDto = z.infer<typeof UpdateCategoryRequestSchema>;

export const ReorderRequestSchema = z.object({
  items: z.array(z.object({ id: z.string(), displayOrder: z.number() })),
});
export type ReorderRequestDto = z.infer<typeof ReorderRequestSchema>;

export const CreateItemRequestSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  basePrice: z.number().min(0),
  imageUrl: z.string().optional().default(''),
  itemType: z.nativeEnum(MenuItemType).optional().default(MenuItemType.SIMPLE),
  isAvailable: z.boolean().optional().default(true),
  isVisible: z.boolean().optional().default(true),
});
export type CreateItemRequestDto = z.infer<typeof CreateItemRequestSchema>;

export const UpdateItemRequestSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
  itemType: z.nativeEnum(MenuItemType).optional(),
  isAvailable: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});
export type UpdateItemRequestDto = z.infer<typeof UpdateItemRequestSchema>;

export const CreateVariantRequestSchema = z.object({
  name: z.string().min(1),
  priceOverride: z.number().nullable().optional().default(null),
  maxSelections: z.number().min(1).optional().default(1),
  displayOrder: z.number().optional().default(0),
});
export type CreateVariantRequestDto = z.infer<typeof CreateVariantRequestSchema>;

export const UpdateVariantRequestSchema = z.object({
  name: z.string().min(1).optional(),
  priceOverride: z.number().nullable().optional(),
  maxSelections: z.number().min(1).optional(),
  displayOrder: z.number().optional(),
});
export type UpdateVariantRequestDto = z.infer<typeof UpdateVariantRequestSchema>;

export const CreateOptionRequestSchema = z.object({
  variantId: z.string().nullable().optional().default(null),
  name: z.string().min(1),
  priceDelta: z.number().optional().default(0),
  optionGroup: z.string().min(1),
  isAvailable: z.boolean().optional().default(true),
});
export type CreateOptionRequestDto = z.infer<typeof CreateOptionRequestSchema>;

export const UpdateOptionRequestSchema = z.object({
  variantId: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  priceDelta: z.number().optional(),
  optionGroup: z.string().optional(),
  isAvailable: z.boolean().optional(),
});
export type UpdateOptionRequestDto = z.infer<typeof UpdateOptionRequestSchema>;
