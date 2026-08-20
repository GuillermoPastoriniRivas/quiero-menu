import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RestaurantStatus } from '../../../../domain/enums/restaurant-status.enum.js';
import {
  StorefrontTheme,
  CustomDomainStatus,
} from '../../../../domain/entities/restaurant.entity.js';

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

  @Prop({
    required: true,
    enum: RestaurantStatus,
    default: RestaurantStatus.ACTIVE,
  })
  status: string;

  @Prop({ type: String, enum: ['open', 'closed'], default: null })
  openOverride: 'open' | 'closed' | null;

  @Prop({ type: String, default: null })
  customDomain: string | null;

  @Prop({ type: Object, default: null })
  customDomainStatus: CustomDomainStatus;

  @Prop({ type: Object, default: null })
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  } | null;

  @Prop({
    type: Object,
    default: {
      cashEnabled: true,
      cardEnabled: true,
      transferEnabled: true,
    },
  })
  paymentMethods!: {
    cashEnabled: boolean;
    cardEnabled: boolean;
    transferEnabled: boolean;
    transferBankName?: string;
    transferAccountType?: string;
    transferAccountNumber?: string;
    transferAccountHolder?: string;
    transferCbu?: string;
    transferAlias?: string;
    transferNotes?: string;
  };

  @Prop({
    type: Object,
    default: { primaryColor: '#E8532C' },
  })
  theme: StorefrontTheme;

  createdAt: Date;
  updatedAt: Date;
}

export const RestaurantSchema = SchemaFactory.createForClass(RestaurantModel);

// Un custom domain solo puede estar asignado a un tenant.
RestaurantSchema.index(
  { customDomain: 1 },
  {
    unique: true,
    partialFilterExpression: { customDomain: { $type: 'string' } },
  },
);
