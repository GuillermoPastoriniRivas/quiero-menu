import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StorefrontEventDocument = HydratedDocument<StorefrontEventModel>;

@Schema({ collection: 'storefront_events' })
export class StorefrontEventModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true, enum: ['whatsapp', 'maps', 'instagram'] })
  type: string;

  @Prop({ default: 0 })
  count: number;
}

export const StorefrontEventSchema =
  SchemaFactory.createForClass(StorefrontEventModel);
StorefrontEventSchema.index(
  { restaurantId: 1, date: 1, type: 1 },
  { unique: true },
);
