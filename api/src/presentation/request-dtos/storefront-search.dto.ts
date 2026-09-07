import { z } from 'zod';

export const StorefrontSearchRequestSchema = z.object({
  q: z.string().max(80).optional().default(''),
  city: z.string().max(80).optional().default(''),
  openNow: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type StorefrontSearchRequestDto = z.infer<
  typeof StorefrontSearchRequestSchema
>;
