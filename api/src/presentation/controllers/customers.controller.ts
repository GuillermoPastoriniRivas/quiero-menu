import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  ListCustomersQuerySchema,
  ListCustomersQueryDto,
  ListCustomerOrdersQuerySchema,
  ListCustomerOrdersQueryDto,
} from '../request-dtos/customers.dto.js';
import type { ListCustomersUseCase } from '../../application/use-cases/customers/list-customers.use-case.js';
import type { ListCustomerOrdersUseCase } from '../../application/use-cases/customers/list-customer-orders.use-case.js';

@Controller('customers')
export class CustomerController {
  constructor(
    @Inject('ListCustomersUseCase')
    private readonly listCustomers: ListCustomersUseCase,
    @Inject('ListCustomerOrdersUseCase')
    private readonly listCustomerOrders: ListCustomerOrdersUseCase,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(ListCustomersQuerySchema))
    query: ListCustomersQueryDto,
  ) {
    return this.listCustomers.execute({
      restaurantId: user.restaurantId,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':phone/orders')
  async orders(
    @CurrentUser() user: RequestUser,
    @Param('phone') phone: string,
    @Query(new ZodValidationPipe(ListCustomerOrdersQuerySchema))
    query: ListCustomerOrdersQueryDto,
  ) {
    return this.listCustomerOrders.execute(
      user.restaurantId,
      phone,
      query.page,
      query.limit,
    );
  }
}
