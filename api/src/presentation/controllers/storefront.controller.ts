import { Controller, Get, Post, Param, Body, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { CreateStorefrontOrderRequestSchema, CreateStorefrontOrderRequestDto } from '../request-dtos/order.dto.js';
import type { GetRestaurantBySlugUseCase } from '../../application/use-cases/restaurant/get-restaurant-by-slug.use-case.js';
import type { CreateStorefrontOrderUseCase } from '../../application/use-cases/order/create-storefront-order.use-case.js';
import { DeliveryType } from '../../domain/enums/delivery-type.enum.js';

@Controller('storefront')
export class StorefrontController {
  constructor(
    @Inject('GetRestaurantBySlugUseCase') private readonly getBySlug: GetRestaurantBySlugUseCase,
    @Inject('CreateStorefrontOrderUseCase') private readonly createOrder: CreateStorefrontOrderUseCase,
  ) {}

  @Public()
  @Get(':slug')
  async getStorefront(@Param('slug') slug: string) {
    const result = await this.getBySlug.execute(slug);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Public()
  @Post(':slug/orders')
  async createStorefrontOrder(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(CreateStorefrontOrderRequestSchema)) body: CreateStorefrontOrderRequestDto,
  ) {
    const result = await this.createOrder.execute(slug, {
      ...body,
      deliveryType: body.deliveryType as DeliveryType,
      customerAddress: body.customerAddress,
      deliveryZoneId: body.deliveryZoneId,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.value;
  }
}
