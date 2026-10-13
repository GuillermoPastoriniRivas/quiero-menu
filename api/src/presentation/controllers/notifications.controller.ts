import {
  Controller,
  Get,
  Patch,
  Body,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  UpdateNotificationPreferencesSchema,
  UpdateNotificationPreferencesDto,
} from '../request-dtos/notification.dto.js';
import type { GetNotificationPreferencesUseCase } from '../../application/use-cases/notifications/get-notification-preferences.use-case.js';
import type { UpdateNotificationPreferencesUseCase } from '../../application/use-cases/notifications/update-notification-preferences.use-case.js';
import { WhatsappAlertsRequireProError } from '../../domain/errors/domain-errors.js';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject('GetNotificationPreferencesUseCase')
    private readonly getPreferences: GetNotificationPreferencesUseCase,
    @Inject('UpdateNotificationPreferencesUseCase')
    private readonly updatePreferences: UpdateNotificationPreferencesUseCase,
  ) {}

  @Get('preferences')
  async get(@CurrentUser() user: RequestUser) {
    const result = await this.getPreferences.execute(
      user._id,
      user.restaurantId,
    );
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('preferences')
  async update(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateNotificationPreferencesSchema))
    body: UpdateNotificationPreferencesDto,
  ) {
    const result = await this.updatePreferences.execute({
      userId: user._id,
      restaurantId: user.restaurantId,
      ...body,
    });
    if (!result.ok) {
      if (result.error instanceof WhatsappAlertsRequireProError)
        throw new ForbiddenException(result.error.message);
      throw new NotFoundException(result.error.message);
    }
    return result.value;
  }
}
