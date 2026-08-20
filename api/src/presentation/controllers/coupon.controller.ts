import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CurrentUser,
  RequestUser,
} from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  CreateCouponRequestSchema,
  CreateCouponRequestDto,
  UpdateCouponRequestSchema,
  UpdateCouponRequestDto,
} from '../request-dtos/coupon.dto.js';
import type { CreateCouponUseCase } from '../../application/use-cases/coupons/create-coupon.use-case.js';
import type { ListCouponsUseCase } from '../../application/use-cases/coupons/list-coupons.use-case.js';
import type { UpdateCouponUseCase } from '../../application/use-cases/coupons/update-coupon.use-case.js';
import type { DeleteCouponUseCase } from '../../application/use-cases/coupons/delete-coupon.use-case.js';
import { CouponType } from '../../domain/enums/coupon-type.enum.js';

@Controller('coupons')
export class CouponController {
  constructor(
    @Inject('CreateCouponUseCase')
    private readonly createCoupon: CreateCouponUseCase,
    @Inject('ListCouponsUseCase')
    private readonly listCoupons: ListCouponsUseCase,
    @Inject('UpdateCouponUseCase')
    private readonly updateCoupon: UpdateCouponUseCase,
    @Inject('DeleteCouponUseCase')
    private readonly deleteCoupon: DeleteCouponUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.listCoupons.execute(user.restaurantId);
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateCouponRequestSchema))
    body: CreateCouponRequestDto,
  ) {
    if (body.type === CouponType.PERCENTAGE && body.value > 100) {
      throw new BadRequestException('El porcentaje no puede superar 100.');
    }
    const value =
      body.type === CouponType.PERCENTAGE || body.type === CouponType.FIXED
        ? body.value
        : 0;
    const result = await this.createCoupon.execute({
      restaurantId: user.restaurantId,
      code: body.code,
      type: body.type,
      value,
      minSubtotal: body.minSubtotal,
      isActive: body.isActive,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    if (!result.ok) throw new BadRequestException(result.error);
    return result.value;
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCouponRequestSchema))
    body: UpdateCouponRequestDto,
  ) {
    const result = await this.updateCoupon.execute(id, user.restaurantId, {
      ...body,
      expiresAt: body.expiresAt != null ? new Date(body.expiresAt) : null,
    });
    if (!result.ok)
      throw result.error.code === 'CROSS_RESTAURANT_ACCESS'
        ? new ForbiddenException(result.error.message)
        : new NotFoundException(result.error.message);
    return result.value;
  }

  @Delete(':id')
  async delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.deleteCoupon.execute(id, user.restaurantId);
    if (!result.ok)
      throw result.error.code === 'CROSS_RESTAURANT_ACCESS'
        ? new ForbiddenException(result.error.message)
        : new NotFoundException(result.error.message);
    return { success: true };
  }
}
