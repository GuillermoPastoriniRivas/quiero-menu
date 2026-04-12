import { Controller, Get, Patch, Body, Inject, NotFoundException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { UpdateRestaurantRequestSchema, UpdateRestaurantRequestDto, UpdateOperatingHoursRequestSchema, UpdateOperatingHoursRequestDto } from '../request-dtos/restaurant.dto.js';
import type { GetRestaurantUseCase } from '../../application/use-cases/restaurant/get-restaurant.use-case.js';
import type { UpdateRestaurantUseCase } from '../../application/use-cases/restaurant/update-restaurant.use-case.js';
import type { UpdateOperatingHoursUseCase } from '../../application/use-cases/restaurant/update-operating-hours.use-case.js';

@Controller('restaurants')
export class RestaurantController {
  constructor(
    @Inject('GetRestaurantUseCase') private readonly getRestaurant: GetRestaurantUseCase,
    @Inject('UpdateRestaurantUseCase') private readonly updateRestaurant: UpdateRestaurantUseCase,
    @Inject('UpdateOperatingHoursUseCase') private readonly updateHours: UpdateOperatingHoursUseCase,
  ) {}

  @Get('current')
  async getCurrent(@CurrentUser() user: RequestUser) {
    const result = await this.getRestaurant.execute(user.restaurantId);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('current')
  async updateCurrent(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateRestaurantRequestSchema)) body: UpdateRestaurantRequestDto,
  ) {
    const result = await this.updateRestaurant.execute(user.restaurantId, body as any);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('current/operating-hours')
  async updateOperatingHours(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateOperatingHoursRequestSchema)) body: UpdateOperatingHoursRequestDto,
  ) {
    return this.updateHours.execute(user.restaurantId, body.hours);
  }
}
