import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatus } from '../../../../domain/enums/order-status.enum.js';
import { OrderSource } from '../../../../domain/enums/order-source.enum.js';
import { DeliveryType } from '../../../../domain/enums/delivery-type.enum.js';

export type OrderDocument = HydratedDocument<OrderModel>;

@Schema({ collection: 'orders', timestamps: { createdAt: true, updatedAt: false } })
export class OrderModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.NEW })
  status: string;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ type: String, default: null })
  customerAddress: string | null;

  @Prop({ type: Number, default: null })
  customerLatitude: number | null;

  @Prop({ type: Number, default: null })
  customerLongitude: number | null;

  @Prop({ required: true, enum: DeliveryType })
  deliveryType: string;

  @Prop({ type: Types.ObjectId, default: null })
  deliveryZoneId: Types.ObjectId | null;

  @Prop({ default: 0 })
  deliveryFee: number;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ required: true })
  total: number;

  @Prop({ default: '' })
  paymentMethod: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ required: true, enum: OrderSource, default: OrderSource.STOREFRONT })
  source: string;

  @Prop({ type: Date, default: null })
  confirmedAt: Date | null;

  @Prop({ type: Date, default: null })
  readyAt: Date | null;

  @Prop({ type: Date, default: null })
  deliveredAt: Date | null;

  createdAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(OrderModel);
OrderSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
OrderSchema.index({ restaurantId: 1, status: 1 });
