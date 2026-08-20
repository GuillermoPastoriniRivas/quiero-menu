import { CouponType } from '../enums/coupon-type.enum.js';

export class Coupon {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly code: string,
    public readonly type: CouponType,
    public readonly value: number,
    public readonly minSubtotal: number,
    public readonly isActive: boolean,
    public readonly expiresAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
