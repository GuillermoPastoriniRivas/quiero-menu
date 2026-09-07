import {
  Controller,
  Get,
  Param,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator.js';
import type { GetOrderTrackingUseCase } from '../../application/use-cases/order/get-order-tracking.use-case.js';

@Controller('tracking')
export class TrackingController {
  constructor(
    @Inject('GetOrderTrackingUseCase')
    private readonly getOrderTracking: GetOrderTrackingUseCase,
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
}
