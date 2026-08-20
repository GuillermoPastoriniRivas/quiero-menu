import { Coupon } from '../../domain/entities/coupon.entity.js';
import { CouponType } from '../../domain/enums/coupon-type.enum.js';

export interface CouponDiscountResult {
  discount: number;
  freeDelivery: boolean;
}

export function isCouponApplicable(coupon: Coupon, subtotal: number): boolean {
  if (!coupon.isActive) return false;
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return false;
  if (subtotal < coupon.minSubtotal) return false;
  return true;
}

export function computeCouponDiscount(
  coupon: Coupon,
  subtotal: number,
): CouponDiscountResult {
  if (coupon.type === CouponType.PERCENTAGE) {
    return {
      discount: Math.round((subtotal * coupon.value) / 100),
      freeDelivery: false,
    };
  }
  if (coupon.type === CouponType.FIXED) {
    return { discount: Math.min(coupon.value, subtotal), freeDelivery: false };
  }
  return { discount: 0, freeDelivery: true };
}
