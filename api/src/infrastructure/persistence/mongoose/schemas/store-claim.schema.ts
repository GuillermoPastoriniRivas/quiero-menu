import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoreClaimDocument = HydratedDocument<StoreClaimModel>;

@Schema({
  collection: 'store_claims',
  timestamps: { createdAt: true, updatedAt: false },
})
export class StoreClaimModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  message: string;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  createdAt: Date;
}

export const StoreClaimSchema = SchemaFactory.createForClass(StoreClaimModel);
StoreClaimSchema.index({ status: 1, createdAt: -1 });
StoreClaimSchema.index({ restaurantId: 1, status: 1 });
