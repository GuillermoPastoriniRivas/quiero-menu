import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeliveryZoneRepository } from '../../../../domain/repositories/delivery-zone.repository.js';
import { DeliveryZone } from '../../../../domain/entities/delivery-zone.entity.js';
import { DeliveryZoneModel, DeliveryZoneDocument } from '../schemas/delivery-zone.schema.js';
import { DeliveryZoneMapper } from '../mappers/delivery-zone.mapper.js';

@Injectable()
export class MongoDeliveryZoneRepository implements DeliveryZoneRepository {
  constructor(@InjectModel(DeliveryZoneModel.name) private readonly model: Model<DeliveryZoneDocument>) {}

  async create(data: Omit<DeliveryZone, 'id'>): Promise<DeliveryZone> {
    const doc = await this.model.create({ ...data, restaurantId: new Types.ObjectId(data.restaurantId) });
    return DeliveryZoneMapper.toDomain(doc);
  }

  async findByRestaurantId(restaurantId: string): Promise<DeliveryZone[]> {
    const docs = await this.model.find({ restaurantId: new Types.ObjectId(restaurantId) });
    return docs.map(DeliveryZoneMapper.toDomain);
  }

  async findById(id: string): Promise<DeliveryZone | null> {
    const doc = await this.model.findById(id);
    return doc ? DeliveryZoneMapper.toDomain(doc) : null;
  }

  async update(id: string, data: Partial<Omit<DeliveryZone, 'id' | 'restaurantId'>>): Promise<DeliveryZone | null> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return doc ? DeliveryZoneMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }
}
