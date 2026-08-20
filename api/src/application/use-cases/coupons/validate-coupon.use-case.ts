import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import { Result, ok, err } from '../../common/result.js';
import {
  RestaurantNotFoundError,
  CouponNotFoundError,
  CouponInvalidError,
} from '../../../domain/errors/domain-errors.js';
import {
  isCouponApplicable,
  computeCouponDiscount,
} from '../../common/coupon-discount.js';
import { CouponType } from '../../../domain/enums/coupon-type.enum.js';

export interface ValidateCouponOutput {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  subtotal: number;
  discount: number;
  freeDelivery: boolean;
}

export class ValidateCouponUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly couponRepo: CouponRepository,
  ) {}

  async execute(
    slug: string,
    code: string,
    subtotal: number,
  ): Promise<
    Result<
      ValidateCouponOutput,
      RestaurantNotFoundError | CouponNotFoundError | CouponInvalidError
    >
  > {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const coupon = await this.couponRepo.findByCode(restaurant.id, code);
    if (!coupon) return err(new CouponNotFoundError());

    if (!isCouponApplicable(coupon, subtotal)) {
      const reason =
        subtotal < coupon.minSubtotal
          ? `Este cupon requiere un minimo de compra de ${coupon.minSubtotal}.`
          : coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()
            ? 'Este cupon ya expiro.'
            : 'Este cupon no esta activo.';
      return err(new CouponInvalidError(reason));
    }

    const { discount, freeDelivery } = computeCouponDiscount(coupon, subtotal);

    return ok({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minSubtotal: coupon.minSubtotal,
      subtotal,
      discount,
      freeDelivery,
    });
  }
}
