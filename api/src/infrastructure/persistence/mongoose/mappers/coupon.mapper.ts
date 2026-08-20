import { Coupon } from '../../../../domain/entities/coupon.entity.js';
import { CouponType } from '../../../../domain/enums/coupon-type.enum.js';
import { CouponDocument } from '../schemas/coupon.schema.js';

export class CouponMapper {
  static toDomain(doc: CouponDocument): Coupon {
    return new Coupon(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.code,
      doc.type as CouponType,
      doc.value,
      doc.minSubtotal,
      doc.isActive,
      doc.expiresAt ?? null,
      doc.createdAt,
    );
  }
}
