import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLogRepository } from '../../../../domain/repositories/audit-log.repository.js';
import {
  AuditLogEntry,
  CreateAuditLogEntryData,
} from '../../../../domain/entities/audit-log.entity.js';
import {
  AuditLogModel,
  AuditLogDocument,
} from '../schemas/audit-log.schema.js';

@Injectable()
export class MongoAuditLogRepository implements AuditLogRepository {
  constructor(
    @InjectModel(AuditLogModel.name)
    private readonly model: Model<AuditLogDocument>,
  ) {}

  async append(data: CreateAuditLogEntryData): Promise<void> {
    await this.model.create({
      event: data.event,
      actorUserId: data.actorUserId
        ? new Types.ObjectId(data.actorUserId)
        : null,
      restaurantId: data.restaurantId
        ? new Types.ObjectId(data.restaurantId)
        : null,
      metadata: data.metadata ?? null,
    });
  }

  async findRecent(limit: number): Promise<AuditLogEntry[]> {
    const docs = await this.model
      .find()
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200));
    return docs.map((doc) => ({
      id: String(doc._id),
      event: doc.event,
      actorUserId: doc.actorUserId ? String(doc.actorUserId) : null,
      restaurantId: doc.restaurantId ? String(doc.restaurantId) : null,
      metadata: doc.metadata ?? null,
      createdAt: doc.createdAt,
    }));
  }
}
