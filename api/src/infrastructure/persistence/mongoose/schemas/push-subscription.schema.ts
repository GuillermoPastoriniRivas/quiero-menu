import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PushSubscriptionDocument = HydratedDocument<PushSubscriptionModel>;

@Schema({ collection: 'push_subscriptions', timestamps: { createdAt: true, updatedAt: false } })
export class PushSubscriptionModel {
  @Prop({ required: true, unique: true })
  endpoint: string;

  @Prop({ type: Object, required: true })
  keys: { p256dh: string; auth: string };

  @Prop({ type: Types.ObjectId, default: null })
  userId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, default: null })
  restaurantId: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  orderCode: string | null;

  @Prop({ type: String, default: null })
  orderSlug: string | null;

  createdAt: Date;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscriptionModel);
PushSubscriptionSchema.index({ restaurantId: 1 });
PushSubscriptionSchema.index({ orderCode: 1 });