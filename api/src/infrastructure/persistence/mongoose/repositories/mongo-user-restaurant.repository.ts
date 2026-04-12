import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRestaurantRepository } from '../../../../domain/repositories/user-restaurant.repository.js';
import { UserRestaurant } from '../../../../domain/entities/user-restaurant.entity.js';
import { UserRestaurantModel, UserRestaurantDocument } from '../schemas/user-restaurant.schema.js';
import { UserRestaurantMapper } from '../mappers/user-restaurant.mapper.js';

@Injectable()
export class MongoUserRestaurantRepository implements UserRestaurantRepository {
  constructor(@InjectModel(UserRestaurantModel.name) private readonly model: Model<UserRestaurantDocument>) {}

  async create(data: Omit<UserRestaurant, 'id'>): Promise<UserRestaurant> {
    const doc = await this.model.create({
      ...data,
      userId: new Types.ObjectId(data.userId),
      restaurantId: new Types.ObjectId(data.restaurantId),
    });
    return UserRestaurantMapper.toDomain(doc);
  }

  async findByUserId(userId: string): Promise<UserRestaurant[]> {
    const docs = await this.model.find({ userId: new Types.ObjectId(userId) });
    return docs.map(UserRestaurantMapper.toDomain);
  }

  async findByRestaurantId(restaurantId: string): Promise<UserRestaurant[]> {
    const docs = await this.model.find({ restaurantId: new Types.ObjectId(restaurantId) });
    return docs.map(UserRestaurantMapper.toDomain);
  }

  async findByUserIdAndRestaurantId(userId: string, restaurantId: string): Promise<UserRestaurant | null> {
    const doc = await this.model.findOne({
      userId: new Types.ObjectId(userId),
      restaurantId: new Types.ObjectId(restaurantId),
    });
    return doc ? UserRestaurantMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }
}
