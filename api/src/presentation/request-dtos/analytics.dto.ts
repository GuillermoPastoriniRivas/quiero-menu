import { z } from 'zod';

export const AnalyticsOverviewQuerySchema = z.object({
  range: z.enum(['7', '30']).optional().default('7'),
});
export type AnalyticsOverviewQueryDto = z.infer<
  typeof AnalyticsOverviewQuerySchema
>;
