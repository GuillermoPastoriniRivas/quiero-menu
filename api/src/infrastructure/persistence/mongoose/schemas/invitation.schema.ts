import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InvitationDocument = HydratedDocument<InvitationModel>;

@Schema({
  collection: 'invitations',
  timestamps: { createdAt: true, updatedAt: false },
})
export class InvitationModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ type: String, default: null })
  email: string | null;

  @Prop({ type: Types.ObjectId, required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;

  @Prop({ type: Types.ObjectId, default: null })
  acceptedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;

  createdAt: Date;
}

export const InvitationSchema = SchemaFactory.createForClass(InvitationModel);
InvitationSchema.index({ restaurantId: 1, createdAt: -1 });
