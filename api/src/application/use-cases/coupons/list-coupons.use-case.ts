import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import { Coupon } from '../../../domain/entities/coupon.entity.js';

export class ListCouponsUseCase {
  constructor(private readonly couponRepo: CouponRepository) {}

  async execute(restaurantId: string): Promise<Coupon[]> {
    return this.couponRepo.findByRestaurantId(restaurantId);
  }
}
