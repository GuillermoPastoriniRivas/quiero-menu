import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BillingEventType } from '../../../../domain/enums/billing-event-type.enum.js';
import { PlanTier } from '../../../../domain/enums/plan-tier.enum.js';

export type BillingRecordDocument = HydratedDocument<BillingRecordModel>;

@Schema({ collection: 'billing_records', timestamps: { createdAt: true, updatedAt: false } })
export class BillingRecordModel {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true, enum: BillingEventType })
  eventType: string;

  @Prop({ required: true, enum: PlanTier })
  plan: string;

  @Prop({ required: true, default: 0 })
  amountCents: number;

  @Prop({ default: '' })
  description: string;

  createdAt: Date;
}

export const BillingRecordSchema = SchemaFactory.createForClass(BillingRecordModel);
