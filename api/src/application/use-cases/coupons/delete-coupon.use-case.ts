import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import { Result, ok, err } from '../../common/result.js';
import {
  CouponNotFoundError,
  CrossRestaurantAccessError,
} from '../../../domain/errors/domain-errors.js';

export class DeleteCouponUseCase {
  constructor(private readonly couponRepo: CouponRepository) {}

  async execute(
    id: string,
    restaurantId: string,
  ): Promise<
    Result<boolean, CouponNotFoundError | CrossRestaurantAccessError>
  > {
    const existing = await this.couponRepo.findById(id);
    if (!existing) return err(new CouponNotFoundError());
    if (existing.restaurantId !== restaurantId)
      return err(new CrossRestaurantAccessError());
    await this.couponRepo.delete(id);
    return ok(true);
  }
}
