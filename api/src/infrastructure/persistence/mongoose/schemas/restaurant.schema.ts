import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RestaurantStatus } from '../../../../domain/enums/restaurant-status.enum.js';

export type RestaurantDocument = HydratedDocument<RestaurantModel>;

@Schema({ collection: 'restaurants', timestamps: true })
export class RestaurantModel {
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  logoUrl: string;

  @Prop({ default: '' })
  bannerUrl: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  city: string;

  @Prop({ default: '' })
  country: string;

  @Prop({ type: Object, default: null })
  coordinates: { lat: number; lng: number } | null;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: 'America/Bogota' })
  timezone: string;

  @Prop({ default: 'COP' })
  currency: string;

  @Prop({ required: true, enum: RestaurantStatus, default: RestaurantStatus.ACTIVE })
  status: string;

  @Prop({ type: String, default: null })
  customDomain: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const RestaurantSchema = SchemaFactory.createForClass(RestaurantModel);
