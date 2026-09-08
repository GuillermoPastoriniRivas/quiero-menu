import { z } from 'zod';

export const ConfirmDeliveryRequestSchema = z.object({
  rating: z.enum(['up', 'down']).optional(),
  onTime: z.boolean().optional(),
});
export type ConfirmDeliveryRequestDto = z.infer<
  typeof ConfirmDeliveryRequestSchema
>;
