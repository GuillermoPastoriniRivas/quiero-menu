import { z } from 'zod';

export const PresignedUrlRequestSchema = z.object({
  type: z.enum(['menu', 'logo', 'banner', 'receipt']),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
export type PresignedUrlRequestDto = z.infer<typeof PresignedUrlRequestSchema>;
