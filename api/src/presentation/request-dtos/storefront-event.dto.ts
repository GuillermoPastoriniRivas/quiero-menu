import { z } from 'zod';
import { StorefrontEventType } from '../../domain/enums/storefront-event-type.enum.js';

export const RecordStorefrontEventRequestSchema = z.object({
  type: z.nativeEnum(StorefrontEventType),
});
export type RecordStorefrontEventRequestDto = z.infer<
  typeof RecordStorefrontEventRequestSchema
>;
