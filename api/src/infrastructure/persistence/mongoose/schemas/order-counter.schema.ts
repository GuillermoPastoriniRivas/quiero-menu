import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderCounterDocument = HydratedDocument<OrderCounterModel>;

@Schema({ collection: 'order_counters' })
export class OrderCounterModel {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const OrderCounterSchema = SchemaFactory.createForClass(OrderCounterModel);
