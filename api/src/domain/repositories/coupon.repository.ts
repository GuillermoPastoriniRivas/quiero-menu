import { Coupon } from '../entities/coupon.entity.js';

export interface CouponRepository {
  create(data: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon>;
  findByRestaurantId(restaurantId: string): Promise<Coupon[]>;
  findByCode(restaurantId: string, code: string): Promise<Coupon | null>;
  findById(id: string): Promise<Coupon | null>;
  update(
    id: string,
    data: Partial<Omit<Coupon, 'id' | 'restaurantId' | 'createdAt'>>,
  ): Promise<Coupon | null>;
  delete(id: string): Promise<boolean>;
  deleteManyByRestaurantId(restaurantId: string): Promise<void>;
}
