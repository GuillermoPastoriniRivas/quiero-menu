import { z } from 'zod';

export const DeleteAccountRequestSchema = z.object({
  password: z.string().min(1),
});
export type DeleteAccountRequestDto = z.infer<
  typeof DeleteAccountRequestSchema
>;
