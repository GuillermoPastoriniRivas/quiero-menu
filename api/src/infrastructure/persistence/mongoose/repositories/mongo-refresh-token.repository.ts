import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RefreshTokenRepository } from '../../../../domain/repositories/refresh-token.repository.js';
import { RefreshToken } from '../../../../domain/entities/refresh-token.entity.js';
import { RefreshTokenModel, RefreshTokenDocument } from '../schemas/refresh-token.schema.js';
import { RefreshTokenMapper } from '../mappers/refresh-token.mapper.js';

@Injectable()
export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  constructor(@InjectModel(RefreshTokenModel.name) private readonly model: Model<RefreshTokenDocument>) {}

  async create(data: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
    const doc = await this.model.create({ ...data, userId: new Types.ObjectId(data.userId) });
    return RefreshTokenMapper.toDomain(doc);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const doc = await this.model.findOne({ tokenHash });
    return doc ? RefreshTokenMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId: new Types.ObjectId(userId) });
  }
}
