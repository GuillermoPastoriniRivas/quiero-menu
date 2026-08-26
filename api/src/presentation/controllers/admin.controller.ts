import {
  Body,
  Controller,
  ConflictException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../guards/admin.guard.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { AuditService } from '../services/audit.service.js';
import {
  AdminSearchRequestSchema,
  AdminSearchRequestDto,
  AdminCreateRestaurantRequestSchema,
  AdminCreateRestaurantRequestDto,
  AdminAuditLogsRequestSchema,
  AdminAuditLogsRequestDto,
} from '../request-dtos/admin.dto.js';
import type { SearchRestaurantsUseCase } from '../../application/use-cases/admin/search-restaurants.use-case.js';
import type { GetRestaurantDetailUseCase } from '../../application/use-cases/admin/get-restaurant-detail.use-case.js';
import type { CreateRestaurantAccountUseCase } from '../../application/use-cases/admin/create-restaurant-account.use-case.js';
import type { ImpersonateRestaurantOwnerUseCase } from '../../application/use-cases/admin/impersonate-restaurant-owner.use-case.js';
import type { ListAuditLogsUseCase } from '../../application/use-cases/admin/list-audit-logs.use-case.js';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    @Inject('SearchRestaurantsUseCase')
    private readonly searchRestaurantsUseCase: SearchRestaurantsUseCase,
    @Inject('GetRestaurantDetailUseCase')
    private readonly getRestaurantDetailUseCase: GetRestaurantDetailUseCase,
    @Inject('CreateRestaurantAccountUseCase')
    private readonly createRestaurantAccountUseCase: CreateRestaurantAccountUseCase,
    @Inject('ImpersonateRestaurantOwnerUseCase')
    private readonly impersonateUseCase: ImpersonateRestaurantOwnerUseCase,
    @Inject('ListAuditLogsUseCase')
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly audit: AuditService,
  ) {}

  @Get('restaurants')
  async search(
    @Query(new ZodValidationPipe(AdminSearchRequestSchema))
    query: AdminSearchRequestDto,
  ) {
    const results = await this.searchRestaurantsUseCase.execute(query.q ?? '');
    return { results };
  }

  @Get('restaurants/:id')
  async detail(@Param('id') id: string) {
    const result = await this.getRestaurantDetailUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    return result.value;
  }

  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('restaurants')
  async create(
    @CurrentUser() admin: RequestUser,
    @Body(new ZodValidationPipe(AdminCreateRestaurantRequestSchema))
    body: AdminCreateRestaurantRequestDto,
  ) {
    const result = await this.createRestaurantAccountUseCase.execute({
      ownerName: body.ownerName,
      email: body.email,
      password: body.password,
      restaurantName: body.restaurantName,
      restaurantSlug: body.restaurantSlug,
      city: body.city,
      currency: body.currency,
      timezone: body.timezone,
      sendOwnerEmails: body.sendOwnerEmails,
    });
    if (!result.ok) throw new ConflictException(result.error.message);
    this.audit.log(
      'admin.restaurant_created',
      admin._id,
      result.value.restaurantId,
      { email: body.email, slug: result.value.slug },
    );
    return result.value;
  }

  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('restaurants/:id/impersonate')
  async impersonate(
    @CurrentUser() admin: RequestUser,
    @Param('id') restaurantId: string,
  ) {
    const result = await this.impersonateUseCase.execute(restaurantId);
    if (!result.ok) throw new NotFoundException(result.error.message);
    this.audit.log('admin.impersonated', admin._id, restaurantId, {
      targetUserId: result.value.user.id,
      targetEmail: result.value.user.email,
    });
    return result.value;
  }

  @Get('audit-logs')
  async auditLogs(
    @Query(new ZodValidationPipe(AdminAuditLogsRequestSchema))
    query: AdminAuditLogsRequestDto,
  ) {
    const entries = await this.listAuditLogsUseCase.execute(query.limit);
    return { entries };
  }
}
