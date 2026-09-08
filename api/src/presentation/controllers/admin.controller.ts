import {
  BadRequestException,
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
  AdminCreateUnclaimedRestaurantRequestSchema,
  AdminCreateUnclaimedRestaurantRequestDto,
  AdminAssignFeaturedRequestSchema,
  AdminAssignFeaturedRequestDto,
  AdminApproveClaimRequestSchema,
  AdminApproveClaimRequestDto,
  AdminAuditLogsRequestSchema,
  AdminAuditLogsRequestDto,
  AdminSearchTermsRequestSchema,
  AdminSearchTermsRequestDto,
} from '../request-dtos/admin.dto.js';
import type { SearchRestaurantsUseCase } from '../../application/use-cases/admin/search-restaurants.use-case.js';
import type { GetRestaurantDetailUseCase } from '../../application/use-cases/admin/get-restaurant-detail.use-case.js';
import type { CreateRestaurantAccountUseCase } from '../../application/use-cases/admin/create-restaurant-account.use-case.js';
import type { CreateUnclaimedRestaurantUseCase } from '../../application/use-cases/claims/create-unclaimed-restaurant.use-case.js';
import type { ImpersonateRestaurantOwnerUseCase } from '../../application/use-cases/admin/impersonate-restaurant-owner.use-case.js';
import type { ListAuditLogsUseCase } from '../../application/use-cases/admin/list-audit-logs.use-case.js';
import type { ListSearchTermsUseCase } from '../../application/use-cases/analytics/list-search-terms.use-case.js';
import type { ListStoreClaimsUseCase } from '../../application/use-cases/claims/list-store-claims.use-case.js';
import type { AssignFeaturedSlotUseCase } from '../../application/use-cases/featured/assign-featured-slot.use-case.js';
import type { ListFeaturedSlotsUseCase } from '../../application/use-cases/featured/list-featured-slots.use-case.js';
import type { DeactivateFeaturedSlotUseCase } from '../../application/use-cases/featured/deactivate-featured-slot.use-case.js';
import { FeaturedSlotFullError } from '../../domain/errors/domain-errors.js';
import { RestaurantNotFeatureableError } from '../../domain/errors/domain-errors.js';
import type { ApproveStoreClaimUseCase } from '../../application/use-cases/claims/approve-store-claim.use-case.js';
import type { RejectStoreClaimUseCase } from '../../application/use-cases/claims/reject-store-claim.use-case.js';
import type { StoreClaimStatus } from '../../domain/entities/store-claim.entity.js';

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
    @Inject('ListSearchTermsUseCase')
    private readonly listSearchTermsUseCase: ListSearchTermsUseCase,
    @Inject('ListStoreClaimsUseCase')
    private readonly listStoreClaimsUseCase: ListStoreClaimsUseCase,
    @Inject('ApproveStoreClaimUseCase')
    private readonly approveStoreClaimUseCase: ApproveStoreClaimUseCase,
    @Inject('RejectStoreClaimUseCase')
    private readonly rejectStoreClaimUseCase: RejectStoreClaimUseCase,
    @Inject('CreateUnclaimedRestaurantUseCase')
    private readonly createUnclaimedRestaurantUseCase: CreateUnclaimedRestaurantUseCase,
    @Inject('AssignFeaturedSlotUseCase')
    private readonly assignFeaturedSlotUseCase: AssignFeaturedSlotUseCase,
    @Inject('ListFeaturedSlotsUseCase')
    private readonly listFeaturedSlotsUseCase: ListFeaturedSlotsUseCase,
    @Inject('DeactivateFeaturedSlotUseCase')
    private readonly deactivateFeaturedSlotUseCase: DeactivateFeaturedSlotUseCase,
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
      category: body.category,
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

  /** Qué buscan los comensales en el directorio (demanda insatisfecha). */
  @Get('search-terms')
  async searchTerms(
    @Query(new ZodValidationPipe(AdminSearchTermsRequestSchema))
    query: AdminSearchTermsRequestDto,
  ) {
    const terms = await this.listSearchTermsUseCase.execute(query.limit);
    return { terms };
  }

  /** Alta de inventario: local sin dueño (claimed=false). */
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('restaurants/unclaimed')
  async createUnclaimed(
    @CurrentUser() admin: RequestUser,
    @Body(new ZodValidationPipe(AdminCreateUnclaimedRestaurantRequestSchema))
    body: AdminCreateUnclaimedRestaurantRequestDto,
  ) {
    const result = await this.createUnclaimedRestaurantUseCase.execute({
      restaurantName: body.restaurantName,
      restaurantSlug: body.restaurantSlug,
      city: body.city,
      category: body.category,
      currency: body.currency,
      timezone: body.timezone,
    });
    if (!result.ok) throw new ConflictException(result.error.message);
    this.audit.log(
      'admin.restaurant_unclaimed_created',
      admin._id,
      result.value.restaurantId,
      { slug: result.value.slug },
    );
    return result.value;
  }

  /** Cola de pedidos de cuenta. */
  @Get('claims')
  async claims(@Query('status') status?: string) {
    const valid: StoreClaimStatus[] = ['pending', 'approved', 'rejected'];
    const claims = await this.listStoreClaimsUseCase.execute(
      valid.includes(status as StoreClaimStatus)
        ? (status as StoreClaimStatus)
        : 'pending',
    );
    return { claims };
  }

  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('claims/:id/approve')
  async approveClaim(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdminApproveClaimRequestSchema))
    body: AdminApproveClaimRequestDto,
  ) {
    const result = await this.approveStoreClaimUseCase.execute(id, {
      ownerName: body.ownerName,
      email: body.email,
    });
    if (!result.ok) throw new ConflictException(result.error.message);
    this.audit.log(
      'admin.claim_approved',
      admin._id,
      result.value.restaurantId,
      {
        claimId: id,
        email: body.email,
      },
    );
    return result.value;
  }

  @Post('claims/:id/reject')
  async rejectClaim(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
  ) {
    const result = await this.rejectStoreClaimUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    this.audit.log('admin.claim_rejected', admin._id, id, { claimId: id });
    return result.value;
  }

  /** Destacados vigentes (lo que cobra visibilidad). */
  @Get('featured')
  async featured() {
    const slots = await this.listFeaturedSlotsUseCase.execute();
    return { slots };
  }

  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  @Post('featured')
  async assignFeatured(
    @CurrentUser() admin: RequestUser,
    @Body(new ZodValidationPipe(AdminAssignFeaturedRequestSchema))
    body: AdminAssignFeaturedRequestDto,
  ) {
    const result = await this.assignFeaturedSlotUseCase.execute({
      restaurantId: body.restaurantId,
      scope: body.scope,
      days: body.days,
    });
    if (!result.ok) {
      if (result.error instanceof FeaturedSlotFullError) {
        throw new ConflictException(result.error.message);
      }
      if (result.error instanceof RestaurantNotFeatureableError) {
        throw new BadRequestException(result.error.message);
      }
      throw new NotFoundException(result.error.message);
    }
    this.audit.log('admin.featured_assigned', admin._id, body.restaurantId, {
      scope: body.scope,
      days: body.days,
    });
    return result.value;
  }

  @Post('featured/:id/deactivate')
  async deactivateFeatured(
    @CurrentUser() admin: RequestUser,
    @Param('id') id: string,
  ) {
    const result = await this.deactivateFeaturedSlotUseCase.execute(id);
    if (!result.ok) throw new NotFoundException(result.error.message);
    this.audit.log('admin.featured_deactivated', admin._id, id, {
      slotId: id,
    });
    return result.value;
  }
}
