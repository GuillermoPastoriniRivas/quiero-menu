import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  SubscribeStaffRequestSchema,
  SubscribeStaffRequestDto,
  SubscribeOrderRequestSchema,
  SubscribeOrderRequestDto,
  UnsubscribeRequestSchema,
  UnsubscribeRequestDto,
} from '../request-dtos/push.dto.js';
import type { PushServicePort } from '../../application/ports/push-service.port.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import type { RestaurantRepository } from '../../domain/repositories/restaurant.repository.js';

@Controller('push')
export class PushController {
  constructor(
    @Inject('PushServicePort') private readonly pushService: PushServicePort,
    @Inject('OrderRepository') private readonly orderRepo: OrderRepository,
    @Inject('RestaurantRepository')
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  @Public()
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post('subscribe-staff')
  async subscribeStaff(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(SubscribeStaffRequestSchema))
    body: SubscribeStaffRequestDto,
  ) {
    if (!user.restaurantId)
      throw new BadRequestException('Usuario sin restaurante');
    await this.pushService.subscribeStaff(
      user._id,
      user.restaurantId,
      body.subscription,
    );
    return { ok: true };
  }

  @Public()
  @Post('subscribe-order')
  async subscribeOrder(
    @Body(new ZodValidationPipe(SubscribeOrderRequestSchema))
    body: SubscribeOrderRequestDto,
  ) {
    const restaurant = await this.restaurantRepo.findBySlug(body.slug);
    if (!restaurant) throw new BadRequestException('Restaurante no encontrado');
    const order = await this.orderRepo.findByCode(
      restaurant.id,
      body.orderCode,
    );
    if (!order) throw new BadRequestException('Pedido no encontrado');
    await this.pushService.subscribeOrder(
      order.code,
      body.slug,
      body.subscription,
    );
    return { ok: true };
  }

  @Public()
  @Delete('subscribe')
  async unsubscribe(
    @Body(new ZodValidationPipe(UnsubscribeRequestSchema))
    body: UnsubscribeRequestDto,
  ) {
    await this.pushService.unsubscribe(body.endpoint);
    return { ok: true };
  }
}
