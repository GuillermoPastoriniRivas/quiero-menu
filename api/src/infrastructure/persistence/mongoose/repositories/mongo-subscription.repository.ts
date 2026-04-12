import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionRepository } from '../../../../domain/repositories/subscription.repository.js';
import { Subscription } from '../../../../domain/entities/subscription.entity.js';
import { SubscriptionModel, SubscriptionDocument } from '../schemas/subscription.schema.js';
import { SubscriptionMapper } from '../mappers/subscription.mapper.js';

@Injectable()
export class MongoSubscriptionRepository implements SubscriptionRepository {
  constructor(
    @InjectModel(SubscriptionModel.name) private readonly model: Model<SubscriptionDocument>,
  ) {}

  async findByRestaurantId(restaurantId: string): Promise<Subscription | null> {
    const doc = await this.model.findOne({ restaurantId: new Types.ObjectId(restaurantId) });
    return doc ? SubscriptionMapper.toDomain(doc) : null;
  }

  async findByExternalSubscriptionId(externalSubscriptionId: string): Promise<Subscription | null> {
    const doc = await this.model.findOne({ externalSubscriptionId });
    return doc ? SubscriptionMapper.toDomain(doc) : null;
  }

  async create(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
    });
    return SubscriptionMapper.toDomain(doc);
  }

  async update(id: string, data: Partial<Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Subscription | null> {
    const update: Record<string, unknown> = { ...data };
    if (data.restaurantId) update.restaurantId = new Types.ObjectId(data.restaurantId);
    const doc = await this.model.findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' });
    return doc ? SubscriptionMapper.toDomain(doc) : null;
  }
}
