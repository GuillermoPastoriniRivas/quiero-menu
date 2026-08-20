import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Inject,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../decorators/public.decorator.js';
import { InternalTokenGuard } from '../guards/internal-token.guard.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  UpdateCustomDomainStatusRequestSchema,
  UpdateCustomDomainStatusRequestDto,
} from '../request-dtos/custom-domain.dto.js';
import type { ListPendingCustomDomainsUseCase } from '../../application/use-cases/custom-domain/list-pending-custom-domains.use-case.js';
import type { ListActiveCustomDomainsUseCase } from '../../application/use-cases/custom-domain/list-active-custom-domains.use-case.js';
import type { UpdateCustomDomainStatusUseCase } from '../../application/use-cases/custom-domain/update-custom-domain-status.use-case.js';

@Controller('internal/custom-domains')
@Public()
@UseGuards(InternalTokenGuard)
export class InternalCustomDomainController {
  constructor(
    @Inject('ListPendingCustomDomainsUseCase')
    private readonly listPending: ListPendingCustomDomainsUseCase,
    @Inject('ListActiveCustomDomainsUseCase')
    private readonly listActive: ListActiveCustomDomainsUseCase,
    @Inject('UpdateCustomDomainStatusUseCase')
    private readonly updateStatus: UpdateCustomDomainStatusUseCase,
  ) {}

  @Get('pending')
  async pending() {
    return this.listPending.execute();
  }

  @Get('active')
  async active() {
    return this.listActive.execute();
  }

  @Post(':restaurantId/status')
  async status(
    @Param('restaurantId') restaurantId: string,
    @Body(new ZodValidationPipe(UpdateCustomDomainStatusRequestSchema))
    body: UpdateCustomDomainStatusRequestDto,
  ) {
    const result = await this.updateStatus.execute(
      restaurantId,
      body.state,
      body.failedReason,
    );
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }
}
