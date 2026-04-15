import { Controller, Get, Post, Patch, Param, Body, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { CreateStorefrontOrderRequestSchema, CreateStorefrontOrderRequestDto } from '../request-dtos/order.dto.js';
import { PresignedUrlRequestSchema, PresignedUrlRequestDto } from '../request-dtos/upload.dto.js';
import type { GetRestaurantBySlugUseCase } from '../../application/use-cases/restaurant/get-restaurant-by-slug.use-case.js';
import type { CreateStorefrontOrderUseCase } from '../../application/use-cases/order/create-storefront-order.use-case.js';
import type { GenerateUploadUrlUseCase } from '../../application/use-cases/upload/generate-upload-url.use-case.js';
import type { OrderRepository } from '../../domain/repositories/order.repository.js';
import { DeliveryType } from '../../domain/enums/delivery-type.enum.js';

@Controller('storefront')
export class StorefrontController {
  constructor(
    @Inject('GetRestaurantBySlugUseCase') private readonly getBySlug: GetRestaurantBySlugUseCase,
    @Inject('CreateStorefrontOrderUseCase') private readonly createOrder: CreateStorefrontOrderUseCase,
    @Inject('GenerateUploadUrlUseCase') private readonly generateUploadUrl: GenerateUploadUrlUseCase,
    @Inject('OrderRepository') private readonly orderRepo: OrderRepository,
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
      receiptUrl: body.receiptUrl,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Public()
  @Post(':slug/receipt-upload')
  async getReceiptUploadUrl(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(PresignedUrlRequestSchema)) body: PresignedUrlRequestDto,
  ) {
    const restaurant = await this.getBySlug.execute(slug);
    if (!restaurant.ok) throw new NotFoundException(restaurant.error.message);
    const result = await this.generateUploadUrl.execute({
      restaurantId: restaurant.value.restaurant.id,
      type: 'receipt',
      contentType: body.contentType,
    });
    if (!result.ok) throw new BadRequestException(result.error.message);
    return result.value;
  }

  @Public()
  @Patch(':slug/orders/:id/receipt')
  async attachReceipt(
    @Param('id') id: string,
    @Body() body: { receiptUrl: string },
  ) {
    const order = await this.orderRepo.updateReceiptUrl(id, body.receiptUrl);
    if (!order) throw new NotFoundException('Order not found');
    return { ok: true };
  }
}
