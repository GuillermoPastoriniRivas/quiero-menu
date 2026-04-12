import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PlanTier } from '../../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../../domain/enums/payment-provider.enum.js';

export type SubscriptionDocument = HydratedDocument<SubscriptionModel>;

@Schema({ collection: 'subscriptions', timestamps: true })
export class SubscriptionModel {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, enum: PlanTier, default: PlanTier.FREE })
  plan: string;

  @Prop({ required: true, enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: string;

  @Prop({ type: Date, required: true })
  currentPeriodStart: Date;

  @Prop({ type: Date, default: null })
  currentPeriodEnd: Date | null;

  @Prop({ type: Date, default: null })
  canceledAt: Date | null;

  @Prop({ required: true, enum: PaymentProvider, default: PaymentProvider.NONE })
  paymentProvider: string;

  @Prop({ type: String, default: null })
  externalCustomerId: string | null;

  @Prop({ type: String, default: null, index: true })
  externalSubscriptionId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(SubscriptionModel);
