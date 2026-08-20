import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CouponType } from '../../../../domain/enums/coupon-type.enum.js';

export type CouponDocument = HydratedDocument<CouponModel>;

@Schema({
  collection: 'coupons',
  timestamps: { createdAt: true, updatedAt: false },
})
export class CouponModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: CouponType })
  type: string;

  @Prop({ default: 0 })
  value: number;

  @Prop({ default: 0 })
  minSubtotal: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  createdAt: Date;
}

export const CouponSchema = SchemaFactory.createForClass(CouponModel);
CouponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
