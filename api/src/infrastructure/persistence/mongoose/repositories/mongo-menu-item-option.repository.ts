import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItemOptionRepository } from '../../../../domain/repositories/menu-item-option.repository.js';
import { MenuItemOption } from '../../../../domain/entities/menu-item-option.entity.js';
import { MenuItemOptionModel } from '../schemas/menu-item-option.schema.js';
import { MenuItemOptionMapper } from '../mappers/menu-item-option.mapper.js';

@Injectable()
export class MongoMenuItemOptionRepository implements MenuItemOptionRepository {
  constructor(
    @InjectModel(MenuItemOptionModel.name)
    private readonly model: Model<MenuItemOptionModel>,
  ) {}

  async create(data: Omit<MenuItemOption, 'id'>): Promise<MenuItemOption> {
    const payload = {
      ...data,
      itemId: new Types.ObjectId(data.itemId),
      variantId: data.variantId ? new Types.ObjectId(data.variantId) : null,
    };
    if (data.clientRequestId) {
      const filter = {
        itemId: payload.itemId,
        clientRequestId: data.clientRequestId,
      };
      try {
        const doc = await this.model.findOneAndUpdate(
          filter,
          { $setOnInsert: payload },
          { upsert: true, returnDocument: 'after' },
        );
        return MenuItemOptionMapper.toDomain(doc);
      } catch (error) {
        // Una respuesta perdida o dos envíos simultáneos recuperan la misma opción.
        if ((error as { code?: number }).code !== 11000) throw error;
        const doc = await this.model.findOne(filter);
        if (!doc) throw error;
        return MenuItemOptionMapper.toDomain(doc);
      }
    }
    const doc = await this.model.create(payload);
    return MenuItemOptionMapper.toDomain(doc);
  }

  async findByItemId(itemId: string): Promise<MenuItemOption[]> {
    const docs = await this.model.find({ itemId: new Types.ObjectId(itemId) });
    return docs.map(MenuItemOptionMapper.toDomain);
  }

  async findByItemIds(itemIds: string[]): Promise<MenuItemOption[]> {
    const docs = await this.model.find({
      itemId: { $in: itemIds.map((id) => new Types.ObjectId(id)) },
    });
    return docs.map(MenuItemOptionMapper.toDomain);
  }

  async findByVariantId(variantId: string): Promise<MenuItemOption[]> {
    const docs = await this.model.find({
      variantId: new Types.ObjectId(variantId),
    });
    return docs.map(MenuItemOptionMapper.toDomain);
  }

  async findById(id: string): Promise<MenuItemOption | null> {
    const doc = await this.model.findById(id);
    return doc ? MenuItemOptionMapper.toDomain(doc) : null;
  }

  async update(
    id: string,
    data: Partial<Omit<MenuItemOption, 'id' | 'itemId'>>,
  ): Promise<MenuItemOption | null> {
    const update: Record<string, unknown> = { ...data };
    if (data.variantId !== undefined)
      update.variantId = data.variantId
        ? new Types.ObjectId(data.variantId)
        : null;
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: update },
      { returnDocument: 'after' },
    );
    return doc ? MenuItemOptionMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteByItemId(itemId: string): Promise<void> {
    await this.model.deleteMany({ itemId: new Types.ObjectId(itemId) });
  }
  async deleteManyByRestaurantId(restaurantId: string): Promise<void> {
    await this.model.deleteMany({
      restaurantId: new Types.ObjectId(restaurantId),
    });
  }
}
