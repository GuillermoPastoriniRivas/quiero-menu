import { z } from 'zod';

export const AcceptInvitationRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('google'),
    credential: z.string().min(1),
  }),
  z.object({
    kind: z.literal('password'),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
    password: z.string().min(8).max(200),
  }),
]);
export type AcceptInvitationRequestDto = z.infer<
  typeof AcceptInvitationRequestSchema
>;
