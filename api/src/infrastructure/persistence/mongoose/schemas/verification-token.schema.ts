import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VerificationTokenDocument = HydratedDocument<VerificationTokenModel>;

@Schema({ collection: 'verification_tokens', timestamps: { createdAt: true, updatedAt: false } })
export class VerificationTokenModel {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ required: true, enum: ['email_verification', 'password_reset'] })
  type: string;

  @Prop({ required: true })
  expiresAt: Date;

  createdAt: Date;
}

export const VerificationTokenSchema = SchemaFactory.createForClass(VerificationTokenModel);
VerificationTokenSchema.index({ userId: 1, type: 1 });
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
