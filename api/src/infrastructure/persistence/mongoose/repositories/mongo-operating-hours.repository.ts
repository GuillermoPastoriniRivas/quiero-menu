import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OperatingHoursRepository } from '../../../../domain/repositories/operating-hours.repository.js';
import { OperatingHours } from '../../../../domain/entities/operating-hours.entity.js';
import { OperatingHoursModel, OperatingHoursDocument } from '../schemas/operating-hours.schema.js';
import { OperatingHoursMapper } from '../mappers/operating-hours.mapper.js';

@Injectable()
export class MongoOperatingHoursRepository implements OperatingHoursRepository {
  constructor(@InjectModel(OperatingHoursModel.name) private readonly model: Model<OperatingHoursDocument>) {}

  async findByRestaurantId(restaurantId: string): Promise<OperatingHours[]> {
    const docs = await this.model.find({ restaurantId: new Types.ObjectId(restaurantId) }).sort({ dayOfWeek: 1 });
    return docs.map(OperatingHoursMapper.toDomain);
  }

  async upsertBulk(restaurantId: string, hours: Omit<OperatingHours, 'id' | 'restaurantId'>[]): Promise<OperatingHours[]> {
    const rid = new Types.ObjectId(restaurantId);
    await this.model.deleteMany({ restaurantId: rid });
    const docs = await this.model.insertMany(hours.map((h) => ({ ...h, restaurantId: rid })));
    return docs.map(OperatingHoursMapper.toDomain);
  }

  async deleteByRestaurantId(restaurantId: string): Promise<void> {
    await this.model.deleteMany({ restaurantId: new Types.ObjectId(restaurantId) });
  }
}
