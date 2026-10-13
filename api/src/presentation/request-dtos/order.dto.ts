import { z } from 'zod';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { DeliveryType } from '../../domain/enums/delivery-type.enum.js';
import { BehaviorContextSchema } from './behavior.dto.js';

export const SelectedOptionsRequestSchema = z.array(z.object({
  groupId: z.string().min(1),
  optionId: z.string().min(1),
  quantity: z.number().int().positive(),
}));

export const CreateStorefrontOrderRequestSchema = z.object({
  attribution: BehaviorContextSchema.optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
        selectedOptionIds: z.array(z.string()).optional().default([]),
        selectedOptions: SelectedOptionsRequestSchema.optional(),
        components: z.array(z.object({
          slotId: z.string().min(1),
          menuItemId: z.string().min(1),
          variantId: z.string().optional(),
          selectedOptions: SelectedOptionsRequestSchema.optional(),
        })).optional(),
        notes: z.string().optional().default(''),
      }).refine((item) => item.selectedOptions === undefined || item.selectedOptionIds.length === 0, {
        message: 'Usá selectedOptions o selectedOptionIds, no ambos.',
        path: ['selectedOptions'],
      }),
    )
    .min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().optional(),
  customerLatitude: z.number().min(-90).max(90).optional(),
  customerLongitude: z.number().min(-180).max(180).optional(),
  deliveryType: z.nativeEnum(DeliveryType),
  paymentMethod: z.string().optional().default('efectivo'),
  receiptUrl: z.string().url().nullable().optional().default(null),
  couponCode: z.string().min(1).max(30).optional().nullable().default(null),
  notes: z.string().max(500).optional().default(''),
});
export type CreateStorefrontOrderRequestDto = z.infer<
  typeof CreateStorefrontOrderRequestSchema
>;

export const UpdateOrderStatusRequestSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
export type UpdateOrderStatusRequestDto = z.infer<
  typeof UpdateOrderStatusRequestSchema
>;

export const OrderQueryParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  status: z.nativeEnum(OrderStatus).optional(),
});
export type OrderQueryParamsDto = z.infer<typeof OrderQueryParamsSchema>;
