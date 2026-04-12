import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KitchenAccessTokenRepository } from '../../../../domain/repositories/kitchen-access-token.repository.js';
import { KitchenAccessToken } from '../../../../domain/entities/kitchen-access-token.entity.js';
import { KitchenAccessTokenModel, KitchenAccessTokenDocument } from '../schemas/kitchen-access-token.schema.js';
import { KitchenAccessTokenMapper } from '../mappers/kitchen-access-token.mapper.js';

@Injectable()
export class MongoKitchenAccessTokenRepository implements KitchenAccessTokenRepository {
  constructor(@InjectModel(KitchenAccessTokenModel.name) private readonly model: Model<KitchenAccessTokenDocument>) {}

  async create(data: Omit<KitchenAccessToken, 'id' | 'createdAt' | 'revokedAt'>): Promise<KitchenAccessToken> {
    const doc = await this.model.create({ ...data, restaurantId: new Types.ObjectId(data.restaurantId) });
    return KitchenAccessTokenMapper.toDomain(doc);
  }

  async findById(id: string): Promise<KitchenAccessToken | null> {
    const doc = await this.model.findById(id);
    return doc ? KitchenAccessTokenMapper.toDomain(doc) : null;
  }

  async findByToken(token: string): Promise<KitchenAccessToken | null> {
    const doc = await this.model.findOne({ token });
    return doc ? KitchenAccessTokenMapper.toDomain(doc) : null;
  }

  async findByRestaurantId(restaurantId: string): Promise<KitchenAccessToken[]> {
    const docs = await this.model.find({ restaurantId: new Types.ObjectId(restaurantId), revokedAt: null });
    return docs.map(KitchenAccessTokenMapper.toDomain);
  }

  async revoke(id: string): Promise<KitchenAccessToken | null> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: { revokedAt: new Date() } }, { returnDocument: 'after' });
    return doc ? KitchenAccessTokenMapper.toDomain(doc) : null;
  }
}
