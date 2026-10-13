import { z } from 'zod';

export const UpdateNotificationPreferencesSchema = z
  .object({
    notifyEmail: z.boolean().optional(),
    notifyWhatsapp: z.boolean().optional(),
  })
  .strict();
export type UpdateNotificationPreferencesDto = z.infer<
  typeof UpdateNotificationPreferencesSchema
>;
