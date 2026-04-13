import { Controller, Get, Post, Delete, Param, Body, Inject, NotFoundException, UnauthorizedException, ForbiddenException, Req } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { Request } from 'express';
import type { CreateKitchenTokenUseCase } from '../../application/use-cases/kitchen/create-kitchen-token.use-case.js';
import type { ValidateKitchenTokenUseCase } from '../../application/use-cases/kitchen/validate-kitchen-token.use-case.js';
import type { ListKitchenTokensUseCase } from '../../application/use-cases/kitchen/list-kitchen-tokens.use-case.js';
import type { RevokeKitchenTokenUseCase } from '../../application/use-cases/kitchen/revoke-kitchen-token.use-case.js';
import type { ListOrdersUseCase } from '../../application/use-cases/order/list-orders.use-case.js';
import type { GetOrderUseCase } from '../../application/use-cases/order/get-order.use-case.js';
import type { UpdateOrderStatusUseCase } from '../../application/use-cases/order/update-order-status.use-case.js';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';

@Controller('kitchen')
export class KitchenController {
  constructor(
    @Inject('CreateKitchenTokenUseCase') private readonly createToken: CreateKitchenTokenUseCase,
    @Inject('ValidateKitchenTokenUseCase') private readonly validateToken: ValidateKitchenTokenUseCase,
    @Inject('ListKitchenTokensUseCase') private readonly listTokens: ListKitchenTokensUseCase,
    @Inject('RevokeKitchenTokenUseCase') private readonly revokeToken: RevokeKitchenTokenUseCase,
    @Inject('ListOrdersUseCase') private readonly listOrders: ListOrdersUseCase,
    @Inject('GetOrderUseCase') private readonly getOrder: GetOrderUseCase,
    @Inject('UpdateOrderStatusUseCase') private readonly updateStatus: UpdateOrderStatusUseCase,
  ) {}

  @Roles('owner', 'manager')
  @Post('tokens')
  async create(@CurrentUser() user: RequestUser, @Body() body: { name?: string }) {
    return this.createToken.execute(user.restaurantId, body.name ?? '');
  }

  @Roles('owner', 'manager')
  @Get('tokens')
  async list(@CurrentUser() user: RequestUser) {
    return this.listTokens.execute(user.restaurantId);
  }

  @Roles('owner', 'manager')
  @Delete('tokens/:id')
  async revoke(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.revokeToken.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Public()
  @Post('auth')
  async authenticate(@Body() body: { token: string }) {
    const result = await this.validateToken.execute(body.token);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    return result.value;
  }

  @Public()
  @Get('orders')
  async getOrders(@Req() req: Request) {
    const kitchenToken = req.headers['x-kitchen-token'] as string;
    if (!kitchenToken) throw new UnauthorizedException('Missing kitchen token');

    const result = await this.validateToken.execute(kitchenToken);
    if (!result.ok) throw new UnauthorizedException(result.error.message);

    return this.listOrders.execute({ restaurantId: result.value.restaurantId });
  }

  @Public()
  @Get('orders/:id')
  async getOrderDetail(@Req() req: Request, @Param('id') id: string) {
    const kitchenToken = req.headers['x-kitchen-token'] as string;
    if (!kitchenToken) throw new UnauthorizedException('Missing kitchen token');

    const result = await this.validateToken.execute(kitchenToken);
    if (!result.ok) throw new UnauthorizedException(result.error.message);

    const orderResult = await this.getOrder.execute(id, result.value.restaurantId);
    if (!orderResult.ok) throw new NotFoundException(orderResult.error.message);
    return { order: orderResult.value.order, items: orderResult.value.items };
  }

  @Public()
  @Post('orders/:id/status')
  async updateOrderStatus(@Req() req: Request, @Param('id') id: string, @Body() body: { status: string }) {
    const kitchenToken = req.headers['x-kitchen-token'] as string;
    if (!kitchenToken) throw new UnauthorizedException('Missing kitchen token');

    const tokenResult = await this.validateToken.execute(kitchenToken);
    if (!tokenResult.ok) throw new UnauthorizedException(tokenResult.error.message);

    const result = await this.updateStatus.execute(id, tokenResult.value.restaurantId, body.status as OrderStatus);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }
}
