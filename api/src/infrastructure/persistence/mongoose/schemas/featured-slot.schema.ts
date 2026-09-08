import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeaturedSlotDocument = HydratedDocument<FeaturedSlotModel>;

@Schema({
  collection: 'featured_slots',
  timestamps: { createdAt: true, updatedAt: false },
})
export class FeaturedSlotModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, enum: ['category', 'home'] })
  scope: string;

  @Prop({ required: true })
  citySlug: string;

  @Prop({ default: '' })
  category: string;

  @Prop({ type: Date, required: true })
  startsAt: Date;

  @Prop({ type: Date, required: true })
  endsAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt: Date;
}

export const FeaturedSlotSchema =
  SchemaFactory.createForClass(FeaturedSlotModel);
FeaturedSlotSchema.index({ scope: 1, citySlug: 1, category: 1, isActive: 1 });
FeaturedSlotSchema.index({ restaurantId: 1 });
