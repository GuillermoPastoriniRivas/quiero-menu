import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItemModel>;

@Schema({ collection: 'order_items' })
export class OrderItemModel {
  @Prop({ type: Types.ObjectId, required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  menuItemId: Types.ObjectId;

  @Prop({ required: true })
  menuItemName: string;

  @Prop({ type: Types.ObjectId, default: null })
  variantId: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  variantName: string | null;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ type: [Object], default: [] })
  selectedOptions: { optionId: string; name: string; priceDelta: number }[];

  @Prop({ default: '' })
  notes: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItemModel);
OrderItemSchema.index({ orderId: 1 });
