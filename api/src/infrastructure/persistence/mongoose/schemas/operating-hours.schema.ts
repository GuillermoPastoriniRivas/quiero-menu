import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OperatingHoursDocument = HydratedDocument<OperatingHoursModel>;

@Schema({ collection: 'operating_hours' })
export class OperatingHoursModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek: number;

  @Prop({ required: true })
  opensAt: string;

  @Prop({ required: true })
  closesAt: string;

  @Prop({ default: false })
  isClosed: boolean;
}

export const OperatingHoursSchema = SchemaFactory.createForClass(OperatingHoursModel);
OperatingHoursSchema.index({ restaurantId: 1, dayOfWeek: 1 }, { unique: true });
