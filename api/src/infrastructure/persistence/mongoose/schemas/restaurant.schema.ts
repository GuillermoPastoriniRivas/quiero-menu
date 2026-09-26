import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RestaurantStatus } from '../../../../domain/enums/restaurant-status.enum.js';
import { RestaurantCategory } from '../../../../domain/enums/restaurant-category.enum.js';
import {
  StorefrontTheme,
  CustomDomainStatus,
  PhotoGalleryImage,
  RestaurantActivation,
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

  @Prop({ type: String, enum: RestaurantCategory, default: '' })
  category: string;

  @Prop({ default: '' })
  citySlug: string;

  /** Provincia/departamento/estado (display). Vacío = pendiente de clasificar. */
  @Prop({ default: '' })
  region: string;

  /** Join keys geo del directorio (/en/{pais}/{region}/{ciudad}). */
  @Prop({ default: '' })
  countrySlug: string;

  @Prop({ default: '' })
  regionSlug: string;

  /**
   * false = cargado como inventario por el equipo, reclamable desde el
   * storefront. Los docs viejos no tienen el campo y se leen como true.
   */
  @Prop({ type: Boolean, default: true })
  claimed: boolean;

  /** Galería de fotos de la ficha de inventario (embeddocs aplanados). */
  @Prop({
    type: [
      {
        url: { type: String, required: true },
        source: { type: String, enum: ['s3', 'external'], required: true },
        alt: String,
      },
    ],
    default: [],
  })
  photoGallery: PhotoGalleryImage[];

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

  @Prop({ type: Object, default: null })
  activation: RestaurantActivation | null;

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
