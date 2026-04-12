import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItemRepository } from '../../../../domain/repositories/menu-item.repository.js';
import { MenuItem } from '../../../../domain/entities/menu-item.entity.js';
import { MenuItemModel, MenuItemDocument } from '../schemas/menu-item.schema.js';
import { MenuItemMapper } from '../mappers/menu-item.mapper.js';

@Injectable()
export class MongoMenuItemRepository implements MenuItemRepository {
  constructor(@InjectModel(MenuItemModel.name) private readonly model: Model<MenuItemDocument>) {}

  async create(data: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
      categoryId: new Types.ObjectId(data.categoryId),
    });
    return MenuItemMapper.toDomain(doc);
  }

  async findByRestaurantId(restaurantId: string): Promise<MenuItem[]> {
    const docs = await this.model.find({ restaurantId: new Types.ObjectId(restaurantId) }).sort({ displayOrder: 1 });
    return docs.map(MenuItemMapper.toDomain);
  }

  async findByCategoryId(categoryId: string): Promise<MenuItem[]> {
    const docs = await this.model.find({ categoryId: new Types.ObjectId(categoryId) }).sort({ displayOrder: 1 });
    return docs.map(MenuItemMapper.toDomain);
  }

  async findById(id: string): Promise<MenuItem | null> {
    const doc = await this.model.findById(id);
    return doc ? MenuItemMapper.toDomain(doc) : null;
  }

  async update(id: string, data: Partial<Omit<MenuItem, 'id' | 'restaurantId'>>): Promise<MenuItem | null> {
    const update: Record<string, unknown> = { ...data };
    if (data.categoryId) update.categoryId = new Types.ObjectId(data.categoryId);
    const doc = await this.model.findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' });
    return doc ? MenuItemMapper.toDomain(doc) : null;
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

  async deleteByCategoryId(categoryId: string): Promise<void> {
    await this.model.deleteMany({ categoryId: new Types.ObjectId(categoryId) });
  }
}
