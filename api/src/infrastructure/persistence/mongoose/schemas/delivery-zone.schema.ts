import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryZoneDocument = HydratedDocument<DeliveryZoneModel>;

@Schema({ collection: 'delivery_zones' })
export class DeliveryZoneModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 30 })
  estimatedMinutes: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const DeliveryZoneSchema = SchemaFactory.createForClass(DeliveryZoneModel);
DeliveryZoneSchema.index({ restaurantId: 1 });
