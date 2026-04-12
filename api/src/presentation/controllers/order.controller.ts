import { Controller, Get, Patch, Param, Query, Body, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { UpdateOrderStatusRequestSchema, UpdateOrderStatusRequestDto, OrderQueryParamsSchema, OrderQueryParamsDto } from '../request-dtos/order.dto.js';
import type { ListOrdersUseCase } from '../../application/use-cases/order/list-orders.use-case.js';
import type { GetOrderUseCase } from '../../application/use-cases/order/get-order.use-case.js';
import type { UpdateOrderStatusUseCase } from '../../application/use-cases/order/update-order-status.use-case.js';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject('ListOrdersUseCase') private readonly listOrders: ListOrdersUseCase,
    @Inject('GetOrderUseCase') private readonly getOrder: GetOrderUseCase,
    @Inject('UpdateOrderStatusUseCase') private readonly updateStatus: UpdateOrderStatusUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query(new ZodValidationPipe(OrderQueryParamsSchema)) query: OrderQueryParamsDto) {
    return this.listOrders.execute({
      restaurantId: user.restaurantId,
      status: query.status as OrderStatus | undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.getOrder.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch(':id/status')
  async changeStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusRequestSchema)) body: UpdateOrderStatusRequestDto,
  ) {
    const result = await this.updateStatus.execute(id, user.restaurantId, body.status as OrderStatus);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new BadRequestException(result.error.message);
    return result.value;
  }
}
