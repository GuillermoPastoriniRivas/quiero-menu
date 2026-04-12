import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItemVariantRepository } from '../../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemVariant } from '../../../../domain/entities/menu-item-variant.entity.js';
import { MenuItemVariantModel, MenuItemVariantDocument } from '../schemas/menu-item-variant.schema.js';
import { MenuItemVariantMapper } from '../mappers/menu-item-variant.mapper.js';

@Injectable()
export class MongoMenuItemVariantRepository implements MenuItemVariantRepository {
  constructor(@InjectModel(MenuItemVariantModel.name) private readonly model: Model<MenuItemVariantDocument>) {}

  async create(data: Omit<MenuItemVariant, 'id'>): Promise<MenuItemVariant> {
    const doc = await this.model.create({ ...data, itemId: new Types.ObjectId(data.itemId) });
    return MenuItemVariantMapper.toDomain(doc);
  }

  async findByItemId(itemId: string): Promise<MenuItemVariant[]> {
    const docs = await this.model.find({ itemId: new Types.ObjectId(itemId) });
    return docs.map(MenuItemVariantMapper.toDomain);
  }

  async findByItemIds(itemIds: string[]): Promise<MenuItemVariant[]> {
    const docs = await this.model.find({ itemId: { $in: itemIds.map((id) => new Types.ObjectId(id)) } });
    return docs.map(MenuItemVariantMapper.toDomain);
  }

  async findById(id: string): Promise<MenuItemVariant | null> {
    const doc = await this.model.findById(id);
    return doc ? MenuItemVariantMapper.toDomain(doc) : null;
  }

  async update(id: string, data: Partial<Omit<MenuItemVariant, 'id' | 'itemId'>>): Promise<MenuItemVariant | null> {
    const doc = await this.model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return doc ? MenuItemVariantMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteByItemId(itemId: string): Promise<void> {
    await this.model.deleteMany({ itemId: new Types.ObjectId(itemId) });
  }
}
