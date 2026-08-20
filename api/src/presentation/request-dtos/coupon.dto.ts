import { z } from 'zod';
import { CouponType } from '../../domain/enums/coupon-type.enum.js';

export const CreateCouponRequestSchema = z.object({
  code: z.string().min(2).max(30),
  type: z.nativeEnum(CouponType),
  value: z.number().min(0).default(0),
  minSubtotal: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().optional().default(null),
});
export type CreateCouponRequestDto = z.infer<typeof CreateCouponRequestSchema>;

export const UpdateCouponRequestSchema = z.object({
  code: z.string().min(2).max(30).optional(),
  type: z.nativeEnum(CouponType).optional(),
  value: z.number().min(0).optional(),
  minSubtotal: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type UpdateCouponRequestDto = z.infer<typeof UpdateCouponRequestSchema>;

export const ValidateCouponRequestSchema = z.object({
  code: z.string().min(1).max(30),
  subtotal: z.number().min(0),
});
export type ValidateCouponRequestDto = z.infer<
  typeof ValidateCouponRequestSchema
>;
