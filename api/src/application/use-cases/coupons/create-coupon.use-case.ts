import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import { Coupon } from '../../../domain/entities/coupon.entity.js';
import { CouponType } from '../../../domain/enums/coupon-type.enum.js';
import { Result, ok } from '../../common/result.js';

export interface CreateCouponInput {
  restaurantId: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  isActive: boolean;
  expiresAt: Date | null;
}

export class CreateCouponUseCase {
  constructor(private readonly couponRepo: CouponRepository) {}

  async execute(input: CreateCouponInput): Promise<Result<Coupon, never>> {
    const created = await this.couponRepo.create(input);
    return ok(created);
  }
}
