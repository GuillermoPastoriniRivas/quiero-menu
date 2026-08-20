import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLogModel>;

@Schema({
  collection: 'audit_logs',
  timestamps: { createdAt: true, updatedAt: false },
})
export class AuditLogModel {
  @Prop({ required: true, index: true })
  event: string;

  @Prop({ type: Types.ObjectId, default: null })
  actorUserId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, default: null, index: true })
  restaurantId: Types.ObjectId | null;

  @Prop({ type: Object, default: null })
  metadata: Record<string, unknown> | null;

  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLogModel);
AuditLogSchema.index({ event: 1, createdAt: -1 });
