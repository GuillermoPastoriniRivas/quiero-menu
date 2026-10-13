import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserModel>;

@Schema({
  collection: 'users',
  timestamps: { createdAt: true, updatedAt: false },
})
export class UserModel {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String, default: '' })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: true })
  notifyEmail: boolean;

  @Prop({ default: false })
  notifyWhatsapp: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt: Date | null;

  @Prop({ type: Date, default: null })
  lastActiveAt: Date | null;

  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
