import { Controller, Get, Post, Delete, Param, Body, Inject, NotFoundException, UnauthorizedException, ForbiddenException, BadRequestException, Req } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { Request } from 'express';
import type { CreateDeliveryTokenUseCase } from '../../application/use-cases/delivery/create-delivery-token.use-case.js';
import type { ValidateDeliveryTokenUseCase } from '../../application/use-cases/delivery/validate-delivery-token.use-case.js';
import type { ListDeliveryTokensUseCase } from '../../application/use-cases/delivery/list-delivery-tokens.use-case.js';
import type { RevokeDeliveryTokenUseCase } from '../../application/use-cases/delivery/revoke-delivery-token.use-case.js';
import type { ListOrdersUseCase } from '../../application/use-cases/order/list-orders.use-case.js';
import type { GetOrderUseCase } from '../../application/use-cases/order/get-order.use-case.js';
import type { UpdateOrderStatusUseCase } from '../../application/use-cases/order/update-order-status.use-case.js';
import { OrderStatus } from '../../domain/enums/order-status.enum.js';
import { DeliveryType } from '../../domain/enums/delivery-type.enum.js';

const ALLOWED_TRANSITIONS: Record<string, OrderStatus> = {
  [OrderStatus.READY]: OrderStatus.DELIVERING,
  [OrderStatus.DELIVERING]: OrderStatus.DELIVERED,
};

@Controller('delivery')
export class DeliveryController {
  constructor(
    @Inject('CreateDeliveryTokenUseCase') private readonly createToken: CreateDeliveryTokenUseCase,
    @Inject('ValidateDeliveryTokenUseCase') private readonly validateToken: ValidateDeliveryTokenUseCase,
    @Inject('ListDeliveryTokensUseCase') private readonly listTokens: ListDeliveryTokensUseCase,
    @Inject('RevokeDeliveryTokenUseCase') private readonly revokeToken: RevokeDeliveryTokenUseCase,
    @Inject('ListOrdersUseCase') private readonly listOrders: ListOrdersUseCase,
    @Inject('GetOrderUseCase') private readonly getOrder: GetOrderUseCase,
    @Inject('UpdateOrderStatusUseCase') private readonly updateStatus: UpdateOrderStatusUseCase,
  ) {}

  // ─── Admin token CRUD (JWT-protected) ────────────────────────

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

  // ─── Public order endpoints (token via X-Delivery-Token) ─────

  private async validateDeliveryToken(req: Request): Promise<string> {
    const deliveryToken = req.headers['x-delivery-token'] as string;
    if (!deliveryToken) throw new UnauthorizedException('Missing delivery token');
    const result = await this.validateToken.execute(deliveryToken);
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    return result.value.restaurantId;
  }

  @Public()
  @Get('orders')
  async getOrders(@Req() req: Request) {
    const restaurantId = await this.validateDeliveryToken(req);
    const result = await this.listOrders.execute({ restaurantId });

    const deliveryOrders = result.data.filter(
      (o) => o.deliveryType === DeliveryType.DELIVERY &&
        (o.status === OrderStatus.READY || o.status === OrderStatus.DELIVERING),
    );

    return { data: deliveryOrders };
  }

  @Public()
  @Get('orders/:id')
  async getOrderDetail(@Req() req: Request, @Param('id') id: string) {
    const restaurantId = await this.validateDeliveryToken(req);
    const orderResult = await this.getOrder.execute(id, restaurantId);
    if (!orderResult.ok) throw new NotFoundException(orderResult.error.message);

    const order = orderResult.value.order;
    if (order.deliveryType !== DeliveryType.DELIVERY) throw new NotFoundException('Order not found.');

    return { order, items: orderResult.value.items };
  }

  @Public()
  @Post('orders/:id/status')
  async updateOrderStatus(@Req() req: Request, @Param('id') id: string, @Body() body: { status: string }) {
    const restaurantId = await this.validateDeliveryToken(req);

    const orderResult = await this.getOrder.execute(id, restaurantId);
    if (!orderResult.ok) throw new NotFoundException(orderResult.error.message);

    const order = orderResult.value.order;
    const expectedNext = ALLOWED_TRANSITIONS[order.status];
    if (!expectedNext || expectedNext !== body.status) {
      throw new BadRequestException(`Delivery can only transition from ${order.status} to ${expectedNext ?? 'nothing'}.`);
    }

    const result = await this.updateStatus.execute(id, restaurantId, body.status as OrderStatus);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }
}
