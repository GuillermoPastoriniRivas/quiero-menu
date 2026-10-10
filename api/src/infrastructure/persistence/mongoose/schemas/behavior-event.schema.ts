import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { BehaviorContext } from '../../../../domain/entities/behavior-event.entity.js';

@Schema({ collection: 'behavior_events', versionKey: false })
export class BehaviorEventModel {
  @Prop({ required: true }) eventId: string;
  @Prop({ required: true }) event: string;
  @Prop({ required: true }) occurredAt: Date;
  @Prop({ required: true }) receivedAt: Date;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ required: true }) audience: string;
  @Prop({ required: true }) source: string;
  @Prop({ type: Types.ObjectId, default: null })
  restaurantId: Types.ObjectId | null;
  @Prop({ type: Types.ObjectId, default: null })
  actorUserId: Types.ObjectId | null;
  @Prop({ type: Object, default: null }) context: BehaviorContext | null;
  @Prop({ type: Object, default: {} }) properties: Record<string, unknown>;
}

export const BehaviorEventSchema =
  SchemaFactory.createForClass(BehaviorEventModel);
BehaviorEventSchema.index({ eventId: 1 }, { unique: true });
BehaviorEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
BehaviorEventSchema.index({ restaurantId: 1, occurredAt: 1, event: 1 });
BehaviorEventSchema.index({ occurredAt: 1, audience: 1 });
BehaviorEventSchema.index({
  restaurantId: 1,
  'context.sessionId': 1,
  occurredAt: 1,
});

@Schema({ collection: 'behavior_daily', versionKey: false, strict: false })
export class BehaviorDailyModel {
  @Prop({ type: Object }) _id: Record<string, unknown>;
  @Prop() count: number;
  @Prop() updatedAt: Date;
}
export const BehaviorDailySchema =
  SchemaFactory.createForClass(BehaviorDailyModel);

@Schema({ collection: 'behavior_accounts', versionKey: false, strict: false })
export class BehaviorAccountModel {
  @Prop({ type: Types.ObjectId, required: true }) restaurantId: Types.ObjectId;
  @Prop({ type: Object, default: {} }) first: Record<string, Date>;
  @Prop() lastActiveAt: Date;
  @Prop() acquisitionChannel: string;
}
export const BehaviorAccountSchema =
  SchemaFactory.createForClass(BehaviorAccountModel);
BehaviorAccountSchema.index({ restaurantId: 1 }, { unique: true });
