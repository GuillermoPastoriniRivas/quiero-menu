import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  ConfirmDeliveryRequestSchema,
  ConfirmDeliveryRequestDto,
} from '../request-dtos/confirm-delivery.dto.js';
import type { GetOrderTrackingUseCase } from '../../application/use-cases/order/get-order-tracking.use-case.js';
import type { ConfirmDeliveryUseCase } from '../../application/use-cases/order/confirm-delivery.use-case.js';
import { OrderNotDeliveredError } from '../../domain/errors/domain-errors.js';

@Controller('tracking')
export class TrackingController {
  constructor(
    @Inject('GetOrderTrackingUseCase')
    private readonly getOrderTracking: GetOrderTrackingUseCase,
    @Inject('ConfirmDeliveryUseCase')
    private readonly confirmDelivery: ConfirmDeliveryUseCase,
  ) {}

  @Public()
  @Throttle({
    short: { ttl: 1000, limit: 10 },
    medium: { ttl: 60000, limit: 60 },
  })
  @Get(':token')
  async getOrderByTrackingToken(@Param('token') token: string) {
    const result = await this.getOrderTracking.executeByToken(token);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  /**
   * El oráculo: el COMENSAL confirma la entrega con su token (sin login).
   * Desbloquea el cupón de fidelización. Idempotente.
   */
  @Public()
  @Throttle({
    short: { ttl: 1000, limit: 10 },
    medium: { ttl: 60000, limit: 60 },
  })
  @Post(':token/confirm')
  async confirm(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(ConfirmDeliveryRequestSchema))
    body: ConfirmDeliveryRequestDto,
  ) {
    const result = await this.confirmDelivery.execute(token, body);
    if (!result.ok) {
      if (result.error instanceof OrderNotDeliveredError) {
        throw new ConflictException(result.error.message);
      }
      throw new NotFoundException(result.error.message);
    }
    return result.value;
  }
}
