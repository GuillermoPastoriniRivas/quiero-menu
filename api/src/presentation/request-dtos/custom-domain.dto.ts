import { z } from 'zod';

export const SetCustomDomainRequestSchema = z.object({
  domain: z.string().min(1).max(253),
});
export type SetCustomDomainRequestDto = z.infer<
  typeof SetCustomDomainRequestSchema
>;

export const UpdateCustomDomainStatusRequestSchema = z.object({
  state: z.enum(['pending', 'provisioning', 'active', 'failed']),
  failedReason: z.string().optional(),
});
export type UpdateCustomDomainStatusRequestDto = z.infer<
  typeof UpdateCustomDomainStatusRequestSchema
>;
