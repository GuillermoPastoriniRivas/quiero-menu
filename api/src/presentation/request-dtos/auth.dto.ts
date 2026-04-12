import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export const SignupRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  restaurantName: z.string().min(1),
  restaurantSlug: z.string().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
});
export type SignupRequestDto = z.infer<typeof SignupRequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenRequestDto = z.infer<typeof RefreshTokenRequestSchema>;
