import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { Roles } from '../decorators/roles.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  SetCustomDomainRequestSchema,
  SetCustomDomainRequestDto,
} from '../request-dtos/custom-domain.dto.js';
import type { SetCustomDomainUseCase } from '../../application/use-cases/custom-domain/set-custom-domain.use-case.js';
import type { GetCustomDomainUseCase } from '../../application/use-cases/custom-domain/get-custom-domain.use-case.js';
import type { RemoveCustomDomainUseCase } from '../../application/use-cases/custom-domain/remove-custom-domain.use-case.js';
import {
  CustomDomainRequiresProError,
  CustomDomainAlreadyInUseError,
  CustomDomainInvalidError,
} from '../../domain/errors/domain-errors.js';
import { AuditService } from '../services/audit.service.js';

@Controller('restaurants/current/custom-domain')
@Roles('owner')
export class CustomDomainController {
  constructor(
    @Inject('SetCustomDomainUseCase')
    private readonly setCustomDomain: SetCustomDomainUseCase,
    @Inject('GetCustomDomainUseCase')
    private readonly getCustomDomain: GetCustomDomainUseCase,
    @Inject('RemoveCustomDomainUseCase')
    private readonly removeCustomDomain: RemoveCustomDomainUseCase,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async get(@CurrentUser() user: RequestUser) {
    const result = await this.getCustomDomain.execute(user.restaurantId);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Put()
  async set(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(SetCustomDomainRequestSchema))
    body: SetCustomDomainRequestDto,
  ) {
    const result = await this.setCustomDomain.execute(
      user.restaurantId,
      body.domain,
    );
    if (!result.ok) {
      if (result.error instanceof CustomDomainRequiresProError) {
        throw new ConflictException(result.error.message);
      }
      if (result.error instanceof CustomDomainAlreadyInUseError) {
        throw new ConflictException(result.error.message);
      }
      if (result.error instanceof CustomDomainInvalidError) {
        throw new BadRequestException(result.error.message);
      }
      throw new NotFoundException(result.error.message);
    }
    this.audit.log('custom-domain.set', user._id, user.restaurantId);
    return result.value;
  }

  @Delete()
  async remove(@CurrentUser() user: RequestUser) {
    const result = await this.removeCustomDomain.execute(user.restaurantId);
    if (!result.ok) throw new NotFoundException(result.error.message);
    this.audit.log('custom-domain.remove', user._id, user.restaurantId);
    return result.value;
  }
}
