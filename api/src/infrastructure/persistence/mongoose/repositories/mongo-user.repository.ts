import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../../../domain/repositories/user.repository.js';
import { User } from '../../../../domain/entities/user.entity.js';
import { UserModel, UserDocument } from '../schemas/user.schema.js';
import { UserMapper } from '../mappers/user.mapper.js';

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(@InjectModel(UserModel.name) private readonly model: Model<UserDocument>) {}

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const doc = await this.model.create(data);
    return UserMapper.toDomain(doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id);
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email });
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<User | null> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: { passwordHash } }, { returnDocument: 'after' });
    return doc ? UserMapper.toDomain(doc) : null;
  }
}
