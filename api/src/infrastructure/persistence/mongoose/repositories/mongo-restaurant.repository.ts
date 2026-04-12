import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RestaurantRepository } from '../../../../domain/repositories/restaurant.repository.js';
import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { RestaurantModel, RestaurantDocument } from '../schemas/restaurant.schema.js';
import { RestaurantMapper } from '../mappers/restaurant.mapper.js';

@Injectable()
export class MongoRestaurantRepository implements RestaurantRepository {
  constructor(@InjectModel(RestaurantModel.name) private readonly model: Model<RestaurantDocument>) {}

  async create(data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Restaurant> {
    const doc = await this.model.create(data);
    return RestaurantMapper.toDomain(doc);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const doc = await this.model.findById(id);
    return doc ? RestaurantMapper.toDomain(doc) : null;
  }

  async findBySlug(slug: string): Promise<Restaurant | null> {
    const doc = await this.model.findOne({ slug });
    return doc ? RestaurantMapper.toDomain(doc) : null;
  }

  async update(id: string, data: Partial<Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Restaurant | null> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return doc ? RestaurantMapper.toDomain(doc) : null;
  }
}
