import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderFeedbackDocument = HydratedDocument<OrderFeedbackModel>;

@Schema({
  collection: 'order_feedbacks',
  timestamps: { createdAt: true, updatedAt: false },
})
export class OrderFeedbackModel {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  confirmedAt: Date;

  @Prop({ type: String, enum: ['up', 'down'], default: null })
  rating: string | null;

  @Prop({ type: Boolean, default: null })
  onTime: boolean | null;

  @Prop({ type: String, default: null })
  couponCode: string | null;

  createdAt: Date;
}

export const OrderFeedbackSchema =
  SchemaFactory.createForClass(OrderFeedbackModel);
