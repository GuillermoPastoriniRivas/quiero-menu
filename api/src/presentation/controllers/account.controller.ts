import {
  Controller,
  Get,
  Delete,
  Body,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  DeleteAccountRequestSchema,
  DeleteAccountRequestDto,
} from '../request-dtos/account.dto.js';
import { AuditService } from '../services/audit.service.js';
import type { GetAccountDataUseCase } from '../../application/use-cases/account/get-account-data.use-case.js';
import type { DeleteAccountUseCase } from '../../application/use-cases/account/delete-account.use-case.js';

@Controller('account')
export class AccountController {
  constructor(
    @Inject('GetAccountDataUseCase')
    private readonly getAccountData: GetAccountDataUseCase,
    @Inject('DeleteAccountUseCase')
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly audit: AuditService,
  ) {}

  @Get('export')
  async export(@CurrentUser() user: RequestUser) {
    const result = await this.getAccountData.execute(user._id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Delete()
  async deleteAccount(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(DeleteAccountRequestSchema))
    body: DeleteAccountRequestDto,
  ) {
    const result = await this.deleteAccountUseCase.execute(
      user._id,
      body.password,
    );
    if (!result.ok) throw new BadRequestException(result.error.message);
    this.audit.log('account.deleted', user._id, user.restaurantId);
    return { ok: true };
  }
}
