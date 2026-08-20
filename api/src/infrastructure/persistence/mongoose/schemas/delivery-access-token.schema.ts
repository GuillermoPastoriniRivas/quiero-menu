import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeliveryAccessTokenDocument =
  HydratedDocument<DeliveryAccessTokenModel>;

@Schema({
  collection: 'delivery_access_tokens',
  timestamps: { createdAt: true, updatedAt: false },
})
export class DeliveryAccessTokenModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ default: '' })
  name: string;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;

  createdAt: Date;
}

export const DeliveryAccessTokenSchema = SchemaFactory.createForClass(
  DeliveryAccessTokenModel,
);
DeliveryAccessTokenSchema.index({ restaurantId: 1, revokedAt: 1 });
