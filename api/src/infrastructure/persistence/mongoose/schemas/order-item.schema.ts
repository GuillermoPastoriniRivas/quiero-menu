import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import type { SelectedOption, OrderItemComponent } from '../../../../domain/entities/order-item.entity.js';

export type OrderItemDocument = HydratedDocument<OrderItemModel>;

@Schema({ collection: 'order_items' })
export class OrderItemModel {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  orderId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  menuItemId: Types.ObjectId;

  @Prop({ required: true })
  menuItemName: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
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
  selectedOptions: SelectedOption[];

  @Prop({ type: [Object], default: [] })
  components: OrderItemComponent[];

  @Prop({ default: '' })
  notes: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItemModel);
OrderItemSchema.index({ orderId: 1 });
