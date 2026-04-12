import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type KitchenAccessTokenDocument = HydratedDocument<KitchenAccessTokenModel>;

@Schema({ collection: 'kitchen_access_tokens', timestamps: { createdAt: true, updatedAt: false } })
export class KitchenAccessTokenModel {
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

export const KitchenAccessTokenSchema = SchemaFactory.createForClass(KitchenAccessTokenModel);
KitchenAccessTokenSchema.index({ restaurantId: 1, revokedAt: 1 });
