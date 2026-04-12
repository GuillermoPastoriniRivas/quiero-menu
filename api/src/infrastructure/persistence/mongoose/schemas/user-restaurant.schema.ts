import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../../../domain/enums/user-role.enum.js';

export type UserRestaurantDocument = HydratedDocument<UserRestaurantModel>;

@Schema({ collection: 'user_restaurants' })
export class UserRestaurantModel {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, enum: UserRole })
  role: string;
}

export const UserRestaurantSchema = SchemaFactory.createForClass(UserRestaurantModel);
UserRestaurantSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });
