import { z } from 'zod';
import { MenuItemType } from '../../domain/enums/menu-item-type.enum.js';

export const CreateCategoryRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  isVisible: z.boolean().optional().default(true),
  isOptionSource: z.boolean().optional().default(false),
});
export type CreateCategoryRequestDto = z.infer<
  typeof CreateCategoryRequestSchema
>;

export const UpdateCategoryRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isVisible: z.boolean().optional(),
  isOptionSource: z.boolean().optional(),
});
export type UpdateCategoryRequestDto = z.infer<
  typeof UpdateCategoryRequestSchema
>;

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
  isAvailable: z.boolean().optional().default(true),
  name: z.string().min(1),
  priceOverride: z.number().min(0).nullable().optional().default(null),
  maxSelections: z.number().int().min(0).optional().default(1),
  displayOrder: z.number().optional().default(0),
});
export type CreateVariantRequestDto = z.infer<
  typeof CreateVariantRequestSchema
>;

export const UpdateVariantRequestSchema = z.object({
  isAvailable: z.boolean().optional(),
  name: z.string().min(1).optional(),
  priceOverride: z.number().min(0).nullable().optional(),
  maxSelections: z.number().int().min(0).optional(),
  displayOrder: z.number().optional(),
});
export type UpdateVariantRequestDto = z.infer<
  typeof UpdateVariantRequestSchema
>;

export const CreateOptionRequestSchema = z.object({
  groupId: z.string().trim().min(1).max(256).optional(),
  clientRequestId: z.string().uuid().optional(),
  variantId: z.string().nullable().optional().default(null),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  priceDelta: z.number().optional().default(0),
  optionGroup: z.string().min(1),
  isAvailable: z.boolean().optional().default(true),
});
export type CreateOptionRequestDto = z.infer<typeof CreateOptionRequestSchema>;

export const UpdateOptionRequestSchema = z.object({
  groupId: z.string().trim().min(1).max(256).optional(),
  variantId: z.string().nullable().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceDelta: z.number().optional(),
  optionGroup: z.string().optional(),
  isAvailable: z.boolean().optional(),
});
export type UpdateOptionRequestDto = z.infer<typeof UpdateOptionRequestSchema>;

export const UpdateOptionGroupsRequestSchema = z.object({
  groups: z.array(
    z
      .object({
        groupId: z.string().trim().min(1).max(256).optional(),
        selectionMode: z.enum(['single', 'multiple', 'quantities']).optional(),
        requiredTotal: z.number().int().positive().nullable().optional(),
        optionPriceOverrides: z.array(z.object({
          sourceItemId: z.string().regex(/^[a-fA-F0-9]{24}$/),
          priceDelta: z.number(),
        })).optional(),
        name: z.string().trim().min(1),
        minSelections: z.number().int().min(0).optional().default(0),
        maxSelections: z.number().int().min(0).optional().default(0),
        variantId: z.string().nullable().optional().default(null),
        displayOrder: z.number().optional().default(0),
        sourceCategoryId: z
          .string()
          .regex(/^[a-fA-F0-9]{24}$/)
          .nullable()
          .optional(),
      })
      .refine(
        (group) =>
          group.maxSelections === 0 ||
          group.minSelections <= group.maxSelections,
        {
          message: 'El mínimo no puede superar el máximo.',
          path: ['minSelections'],
        },
      ),
  ),
});
export type UpdateOptionGroupsRequestDto = z.infer<
  typeof UpdateOptionGroupsRequestSchema
>;

export const UpdateComponentsRequestSchema = z.object({
  components: z.array(z.object({
    slotId: z.string().trim().min(1).max(256),
    name: z.string().trim().min(1),
    displayOrder: z.number().optional().default(0),
    parentVariantId: z.string().regex(/^[a-fA-F0-9]{24}$/).nullable().optional().default(null),
    quantity: z.number().int().positive(),
    choices: z.array(z.object({
      menuItemId: z.string().regex(/^[a-fA-F0-9]{24}$/),
      variantId: z.string().regex(/^[a-fA-F0-9]{24}$/).nullable().optional().default(null),
      priceDelta: z.number().optional().default(0),
    })).min(1),
  })),
});
export type UpdateComponentsRequestDto = z.infer<typeof UpdateComponentsRequestSchema>;
