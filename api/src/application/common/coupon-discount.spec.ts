import { Coupon } from '../../domain/entities/coupon.entity.js';
import { CouponType } from '../../domain/enums/coupon-type.enum.js';
import {
  isCouponApplicable,
  computeCouponDiscount,
} from './coupon-discount.js';

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return Object.assign(
    new Coupon(
      'c1',
      'r1',
      'CODE10',
      CouponType.PERCENTAGE,
      10,
      0,
      true,
      null,
      new Date('2026-01-01'),
    ),
    overrides,
  );
}

describe('coupon-discount', () => {
  describe('computeCouponDiscount', () => {
    it('calcula porcentaje sobre el subtotal', () => {
      const coupon = makeCoupon({ type: CouponType.PERCENTAGE, value: 10 });
      expect(computeCouponDiscount(coupon, 1000)).toEqual({
        discount: 100,
        freeDelivery: false,
      });
    });

    it('redondea porcentajes fraccionarios', () => {
      const coupon = makeCoupon({ type: CouponType.PERCENTAGE, value: 33 });
      expect(computeCouponDiscount(coupon, 1000)).toEqual({
        discount: 330,
        freeDelivery: false,
      });
    });

    it('monto fijo no supera el subtotal', () => {
      const coupon = makeCoupon({ type: CouponType.FIXED, value: 1500 });
      expect(computeCouponDiscount(coupon, 1000)).toEqual({
        discount: 1000,
        freeDelivery: false,
      });
    });

    it('envio gratis descuenta 0 y marca freeDelivery', () => {
      const coupon = makeCoupon({ type: CouponType.FREE_DELIVERY, value: 0 });
      expect(computeCouponDiscount(coupon, 1000)).toEqual({
        discount: 0,
        freeDelivery: true,
      });
    });
  });

  describe('isCouponApplicable', () => {
    it('acepta un cupon activo sin vencimiento', () => {
      expect(isCouponApplicable(makeCoupon(), 100)).toBe(true);
    });

    it('rechaza cupon inactivo', () => {
      expect(isCouponApplicable(makeCoupon({ isActive: false }), 100)).toBe(
        false,
      );
    });

    it('rechaza cupon vencido', () => {
      const expired = makeCoupon({
        expiresAt: new Date('2020-01-01'),
      });
      expect(isCouponApplicable(expired, 100)).toBe(false);
    });

    it('rechaza si el subtotal no alcanza el minimo', () => {
      const coupon = makeCoupon({ minSubtotal: 5000 });
      expect(isCouponApplicable(coupon, 1000)).toBe(false);
      expect(isCouponApplicable(coupon, 5000)).toBe(true);
    });
  });
});
