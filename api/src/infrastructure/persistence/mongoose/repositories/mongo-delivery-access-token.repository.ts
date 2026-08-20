import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeliveryAccessTokenRepository } from '../../../../domain/repositories/delivery-access-token.repository.js';
import { DeliveryAccessToken } from '../../../../domain/entities/delivery-access-token.entity.js';
import {
  DeliveryAccessTokenModel,
  DeliveryAccessTokenDocument,
} from '../schemas/delivery-access-token.schema.js';
import { DeliveryAccessTokenMapper } from '../mappers/delivery-access-token.mapper.js';

@Injectable()
export class MongoDeliveryAccessTokenRepository implements DeliveryAccessTokenRepository {
  constructor(
    @InjectModel(DeliveryAccessTokenModel.name)
    private readonly model: Model<DeliveryAccessTokenDocument>,
  ) {}

  async create(
    data: Omit<DeliveryAccessToken, 'id' | 'createdAt' | 'revokedAt'>,
  ): Promise<DeliveryAccessToken> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
    });
    return DeliveryAccessTokenMapper.toDomain(doc);
  }

  async findById(id: string): Promise<DeliveryAccessToken | null> {
    const doc = await this.model.findById(id);
    return doc ? DeliveryAccessTokenMapper.toDomain(doc) : null;
  }

  async findByToken(token: string): Promise<DeliveryAccessToken | null> {
    const doc = await this.model.findOne({ token });
    return doc ? DeliveryAccessTokenMapper.toDomain(doc) : null;
  }

  async findByRestaurantId(
    restaurantId: string,
  ): Promise<DeliveryAccessToken[]> {
    const docs = await this.model.find({
      restaurantId: new Types.ObjectId(restaurantId),
      revokedAt: null,
    });
    return docs.map(DeliveryAccessTokenMapper.toDomain);
  }

  async revoke(id: string): Promise<DeliveryAccessToken | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { revokedAt: new Date() } },
      { returnDocument: 'after' },
    );
    return doc ? DeliveryAccessTokenMapper.toDomain(doc) : null;
  }
  async deleteManyByRestaurantId(restaurantId: string): Promise<void> {
    await this.model.deleteMany({
      restaurantId: new Types.ObjectId(restaurantId),
    });
  }
}
