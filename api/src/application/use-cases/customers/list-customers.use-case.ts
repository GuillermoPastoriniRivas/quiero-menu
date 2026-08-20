import {
  OrderRepository,
  CustomerSummary,
  PaginatedResult,
} from '../../../domain/repositories/order.repository.js';

export interface ListCustomersInput {
  restaurantId: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ListCustomersUseCase {
  constructor(private readonly orderRepo: OrderRepository) {}

  async execute(
    input: ListCustomersInput,
  ): Promise<PaginatedResult<CustomerSummary>> {
    return this.orderRepo.listCustomers(input);
  }
}
