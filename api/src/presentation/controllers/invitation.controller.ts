import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  GoneException,
  HttpException,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { AuditService } from '../services/audit.service.js';
import {
  AcceptInvitationRequestSchema,
  AcceptInvitationRequestDto,
} from '../request-dtos/invitation.dto.js';
import type { GetInvitationPreviewUseCase } from '../../application/use-cases/invitations/get-invitation-preview.use-case.js';
import type {
  AcceptInvitationUseCase,
  AcceptInvitationError,
} from '../../application/use-cases/invitations/accept-invitation.use-case.js';
import {
  AccountHasRestaurantError,
  InvalidCredentialsError,
  InvitationEmailMismatchError,
  InvitationNotActiveError,
} from '../../domain/errors/domain-errors.js';

function toHttpError(error: AcceptInvitationError): HttpException {
  if (error instanceof InvitationNotActiveError)
    return new GoneException(error.message);
  if (error instanceof InvitationEmailMismatchError)
    return new ForbiddenException(error.message);
  if (error instanceof InvalidCredentialsError)
    return new BadRequestException(
      'No pudimos verificar tu cuenta: revisá el email y la contraseña, o probá con Google.',
    );
  if (error instanceof AccountHasRestaurantError)
    return new ConflictException(error.message);
  return new NotFoundException(error.message);
}

@Controller('invitations')
export class InvitationController {
  constructor(
    @Inject('GetInvitationPreviewUseCase')
    private readonly getPreview: GetInvitationPreviewUseCase,
    @Inject('AcceptInvitationUseCase')
    private readonly acceptInvitation: AcceptInvitationUseCase,
    private readonly audit: AuditService,
  ) {}

  @Public()
  @Throttle({ short: { limit: 30, ttl: 60_000 } })
  @Get(':token')
  async preview(@Param('token') token: string) {
    const result = await this.getPreview.execute(token);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Public()
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post(':token/accept')
  async accept(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(AcceptInvitationRequestSchema))
    body: AcceptInvitationRequestDto,
  ) {
    const result = await this.acceptInvitation.execute(token, body);
    if (!result.ok) throw toHttpError(result.error);
    this.audit.log(
      'invitation.accepted',
      result.value.user.id,
      result.value.user.restaurantId,
      { email: result.value.user.email, method: body.kind },
    );
    return result.value;
  }
}
