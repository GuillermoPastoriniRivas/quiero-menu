import { z } from 'zod';

export const ListCustomersQuerySchema = z.object({
  search: z.string().max(50).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(30),
});
export type ListCustomersQueryDto = z.infer<typeof ListCustomersQuerySchema>;

export const ListCustomerOrdersQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});
export type ListCustomerOrdersQueryDto = z.infer<
  typeof ListCustomerOrdersQuerySchema
>;
