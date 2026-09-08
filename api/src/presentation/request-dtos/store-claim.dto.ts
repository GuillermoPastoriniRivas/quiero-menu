import { z } from 'zod';

export const RequestStoreClaimRequestSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(6).max(30),
  email: z.string().email(),
  message: z.string().max(500).optional().default(''),
});
export type RequestStoreClaimRequestDto = z.infer<
  typeof RequestStoreClaimRequestSchema
>;
