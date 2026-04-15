import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VerificationTokenRepository, CreateVerificationTokenData } from '../../../../domain/repositories/verification-token.repository.js';
import { VerificationToken, TokenType } from '../../../../domain/entities/verification-token.entity.js';
import { VerificationTokenModel, VerificationTokenDocument } from '../schemas/verification-token.schema.js';
import { VerificationTokenMapper } from '../mappers/verification-token.mapper.js';

@Injectable()
export class MongoVerificationTokenRepository implements VerificationTokenRepository {
  constructor(@InjectModel(VerificationTokenModel.name) private readonly model: Model<VerificationTokenDocument>) {}

  async create(data: CreateVerificationTokenData): Promise<VerificationToken> {
    const doc = await this.model.create({ ...data, userId: new Types.ObjectId(data.userId) });
    return VerificationTokenMapper.toDomain(doc);
  }

  async findByTokenHash(tokenHash: string, type: TokenType): Promise<VerificationToken | null> {
    const doc = await this.model.findOne({ tokenHash, type });
    return doc ? VerificationTokenMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteAllByUserId(userId: string, type: TokenType): Promise<void> {
    await this.model.deleteMany({ userId: new Types.ObjectId(userId), type });
  }
}
