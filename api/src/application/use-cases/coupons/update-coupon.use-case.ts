import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import { Coupon } from '../../../domain/entities/coupon.entity.js';
import { Result, ok, err } from '../../common/result.js';
import {
  CouponNotFoundError,
  CrossRestaurantAccessError,
} from '../../../domain/errors/domain-errors.js';

export class UpdateCouponUseCase {
  constructor(private readonly couponRepo: CouponRepository) {}

  async execute(
    id: string,
    restaurantId: string,
    data: Partial<Omit<Coupon, 'id' | 'restaurantId' | 'createdAt'>>,
  ): Promise<Result<Coupon, CouponNotFoundError | CrossRestaurantAccessError>> {
    const existing = await this.couponRepo.findById(id);
    if (!existing) return err(new CouponNotFoundError());
    if (existing.restaurantId !== restaurantId)
      return err(new CrossRestaurantAccessError());
    const updated = await this.couponRepo.update(id, data);
    if (!updated) return err(new CouponNotFoundError());
    return ok(updated);
  }
}
