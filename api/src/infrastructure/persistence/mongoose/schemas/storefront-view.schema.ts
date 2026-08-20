import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StorefrontViewDocument = HydratedDocument<StorefrontViewModel>;

@Schema({ collection: 'storefront_views' })
export class StorefrontViewModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ default: 0 })
  views: number;
}

export const StorefrontViewSchema =
  SchemaFactory.createForClass(StorefrontViewModel);
StorefrontViewSchema.index({ restaurantId: 1, date: 1 }, { unique: true });
