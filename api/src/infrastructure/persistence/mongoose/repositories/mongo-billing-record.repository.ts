import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingRecordRepository } from '../../../../domain/repositories/billing-record.repository.js';
import { BillingRecord } from '../../../../domain/entities/billing-record.entity.js';
import { BillingRecordModel, BillingRecordDocument } from '../schemas/billing-record.schema.js';
import { BillingRecordMapper } from '../mappers/billing-record.mapper.js';

@Injectable()
export class MongoBillingRecordRepository implements BillingRecordRepository {
  constructor(
    @InjectModel(BillingRecordModel.name) private readonly model: Model<BillingRecordDocument>,
  ) {}

  async create(data: Omit<BillingRecord, 'id' | 'createdAt'>): Promise<BillingRecord> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
    });
    return BillingRecordMapper.toDomain(doc);
  }

  async findByRestaurantId(restaurantId: string): Promise<BillingRecord[]> {
    const docs = await this.model
      .find({ restaurantId: new Types.ObjectId(restaurantId) })
      .sort({ createdAt: -1 });
    return docs.map(BillingRecordMapper.toDomain);
  }
}
