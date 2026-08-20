import {
  Controller,
  Get,
  Patch,
  Body,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { SlugAlreadyExistsError } from '../../domain/errors/domain-errors.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  UpdateRestaurantRequestSchema,
  UpdateRestaurantRequestDto,
  UpdateOperatingHoursRequestSchema,
  UpdateOperatingHoursRequestDto,
  UpdateOpenStatusRequestSchema,
  UpdateOpenStatusRequestDto,
} from '../request-dtos/restaurant.dto.js';
import type { GetRestaurantUseCase } from '../../application/use-cases/restaurant/get-restaurant.use-case.js';
import type { UpdateRestaurantUseCase } from '../../application/use-cases/restaurant/update-restaurant.use-case.js';
import type { UpdateOperatingHoursUseCase } from '../../application/use-cases/restaurant/update-operating-hours.use-case.js';
import type { GetRestaurantOperatingHoursUseCase } from '../../application/use-cases/restaurant/get-restaurant-operating-hours.use-case.js';
import type { UpdateOpenStatusUseCase } from '../../application/use-cases/restaurant/update-open-status.use-case.js';

@Controller('restaurants')
export class RestaurantController {
  constructor(
    @Inject('GetRestaurantUseCase')
    private readonly getRestaurant: GetRestaurantUseCase,
    @Inject('UpdateRestaurantUseCase')
    private readonly updateRestaurant: UpdateRestaurantUseCase,
    @Inject('UpdateOperatingHoursUseCase')
    private readonly updateHours: UpdateOperatingHoursUseCase,
    @Inject('GetRestaurantOperatingHoursUseCase')
    private readonly hoursInfo: GetRestaurantOperatingHoursUseCase,
    @Inject('UpdateOpenStatusUseCase')
    private readonly updateOpenStatus: UpdateOpenStatusUseCase,
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
    @Body(new ZodValidationPipe(UpdateRestaurantRequestSchema))
    body: UpdateRestaurantRequestDto,
  ) {
    const result = await this.updateRestaurant.execute(
      user.restaurantId,
      body as any,
    );
    if (!result.ok) {
      if (result.error instanceof SlugAlreadyExistsError) {
        throw new ConflictException(result.error.message);
      }
      throw new NotFoundException(result.error.message);
    }
    return result.value;
  }

  @Patch('current/operating-hours')
  async updateOperatingHours(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateOperatingHoursRequestSchema))
    body: UpdateOperatingHoursRequestDto,
  ) {
    return this.updateHours.execute(user.restaurantId, body.hours);
  }

  @Get('current/operating-hours')
  async getCurrentOperatingHours(@CurrentUser() user: RequestUser) {
    const result = await this.hoursInfo.execute(user.restaurantId);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('current/open-status')
  async setOpenStatus(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateOpenStatusRequestSchema))
    body: UpdateOpenStatusRequestDto,
  ) {
    const result = await this.updateOpenStatus.execute(
      user.restaurantId,
      body.open,
    );
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }
}
