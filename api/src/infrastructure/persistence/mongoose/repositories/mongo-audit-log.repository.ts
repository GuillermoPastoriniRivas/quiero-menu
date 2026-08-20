import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLogRepository } from '../../../../domain/repositories/audit-log.repository.js';
import { CreateAuditLogEntryData } from '../../../../domain/entities/audit-log.entity.js';
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
}
