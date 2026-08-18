import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PushSubscriptionRepository, CreatePushSubscriptionData } from '../../../../domain/repositories/push-subscription.repository.js';
import { PushSubscription } from '../../../../domain/entities/push-subscription.entity.js';
import { PushSubscriptionModel, PushSubscriptionDocument } from '../schemas/push-subscription.schema.js';
import { PushSubscriptionMapper } from '../mappers/push-subscription.mapper.js';

@Injectable()
export class MongoPushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(@InjectModel(PushSubscriptionModel.name) private readonly model: Model<PushSubscriptionDocument>) {}

  async create(data: CreatePushSubscriptionData): Promise<PushSubscription> {
    const doc = await this.model.create({
      endpoint: data.endpoint,
      keys: data.keys,
      userId: data.userId ? new Types.ObjectId(data.userId) : null,
      restaurantId: data.restaurantId ? new Types.ObjectId(data.restaurantId) : null,
      orderCode: data.orderCode,
      orderSlug: data.orderSlug,
    });
    return PushSubscriptionMapper.toDomain(doc);
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const doc = await this.model.findOne({ endpoint });
    return doc ? PushSubscriptionMapper.toDomain(doc) : null;
  }

  async deleteByEndpoint(endpoint: string): Promise<boolean> {
    const result = await this.model.deleteOne({ endpoint });
    return result.deletedCount > 0;
  }

  async findByRestaurantId(restaurantId: string): Promise<PushSubscription[]> {
    const docs = await this.model.find({ restaurantId: new Types.ObjectId(restaurantId) });
    return docs.map(PushSubscriptionMapper.toDomain);
  }

  async findByOrderCode(orderCode: string): Promise<PushSubscription[]> {
    const docs = await this.model.find({ orderCode });
    return docs.map(PushSubscriptionMapper.toDomain);
  }
}