import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuCategoryRepository } from '../../../../domain/repositories/menu-category.repository.js';
import { MenuCategory } from '../../../../domain/entities/menu-category.entity.js';
import { MenuCategoryModel, MenuCategoryDocument } from '../schemas/menu-category.schema.js';
import { MenuCategoryMapper } from '../mappers/menu-category.mapper.js';

@Injectable()
export class MongoMenuCategoryRepository implements MenuCategoryRepository {
  constructor(@InjectModel(MenuCategoryModel.name) private readonly model: Model<MenuCategoryDocument>) {}

  async create(data: Omit<MenuCategory, 'id'>): Promise<MenuCategory> {
    const doc = await this.model.create({ ...data, restaurantId: new Types.ObjectId(data.restaurantId) });
    return MenuCategoryMapper.toDomain(doc);
  }

  async findByRestaurantId(restaurantId: string): Promise<MenuCategory[]> {
    const docs = await this.model.find({ restaurantId: new Types.ObjectId(restaurantId) }).sort({ displayOrder: 1 });
    return docs.map(MenuCategoryMapper.toDomain);
  }

  async findById(id: string): Promise<MenuCategory | null> {
    const doc = await this.model.findById(id);
    return doc ? MenuCategoryMapper.toDomain(doc) : null;
  }

  async update(id: string, data: Partial<Omit<MenuCategory, 'id' | 'restaurantId'>>): Promise<MenuCategory | null> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return doc ? MenuCategoryMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }

  async reorder(items: { id: string; displayOrder: number }[]): Promise<void> {
    const ops = items.map((item) => ({
      updateOne: { filter: { _id: new Types.ObjectId(item.id) }, update: { $set: { displayOrder: item.displayOrder } } },
    }));
    await this.model.bulkWrite(ops);
  }
}
