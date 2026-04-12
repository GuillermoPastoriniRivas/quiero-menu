import { z } from 'zod';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { DeliveryType } from '../../domain/enums/delivery-type.enum.js';

export const CreateStorefrontOrderRequestSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
    selectedOptionIds: z.array(z.string()).optional().default([]),
    notes: z.string().optional().default(''),
  })).min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().optional(),
  deliveryType: z.nativeEnum(DeliveryType),
  deliveryZoneId: z.string().optional(),
  paymentMethod: z.string().optional().default('efectivo'),
  notes: z.string().max(500).optional().default(''),
});
export type CreateStorefrontOrderRequestDto = z.infer<typeof CreateStorefrontOrderRequestSchema>;

export const UpdateOrderStatusRequestSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
export type UpdateOrderStatusRequestDto = z.infer<typeof UpdateOrderStatusRequestSchema>;

export const OrderQueryParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  status: z.nativeEnum(OrderStatus).optional(),
});
export type OrderQueryParamsDto = z.infer<typeof OrderQueryParamsSchema>;
