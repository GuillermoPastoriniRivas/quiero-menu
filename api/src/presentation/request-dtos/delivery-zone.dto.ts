import { z } from 'zod';

export const CreateDeliveryZoneRequestSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  estimatedMinutes: z.number().min(1).optional().default(30),
  isActive: z.boolean().optional().default(true),
});
export type CreateDeliveryZoneRequestDto = z.infer<typeof CreateDeliveryZoneRequestSchema>;

export const UpdateDeliveryZoneRequestSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  estimatedMinutes: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDeliveryZoneRequestDto = z.infer<typeof UpdateDeliveryZoneRequestSchema>;
