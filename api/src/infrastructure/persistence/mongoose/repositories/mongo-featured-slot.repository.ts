import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FeaturedSlotRepository,
  CreateFeaturedSlotData,
} from '../../../../domain/repositories/featured-slot.repository.js';
import {
  FeaturedSlot,
  FeaturedScope,
} from '../../../../domain/entities/featured-slot.entity.js';
import {
  FeaturedSlotModel,
  FeaturedSlotDocument,
} from '../schemas/featured-slot.schema.js';

function toDomain(doc: FeaturedSlotDocument): FeaturedSlot {
  return new FeaturedSlot(
    doc._id.toHexString(),
    doc.restaurantId instanceof Types.ObjectId
      ? doc.restaurantId.toHexString()
      : String(doc.restaurantId),
    doc.scope as FeaturedScope,
    doc.citySlug,
    doc.category ?? '',
    doc.startsAt,
    doc.endsAt,
    doc.isActive,
    doc.createdAt,
  );
}

@Injectable()
export class MongoFeaturedSlotRepository implements FeaturedSlotRepository {
  constructor(
    @InjectModel(FeaturedSlotModel.name)
    private readonly model: Model<FeaturedSlotDocument>,
  ) {}

  async create(data: CreateFeaturedSlotData): Promise<FeaturedSlot> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
      isActive: true,
    });
    return toDomain(doc);
  }

  async findById(id: string): Promise<FeaturedSlot | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findById(id);
    return doc ? toDomain(doc) : null;
  }

  async listActive(now: Date): Promise<FeaturedSlot[]> {
    const docs = await this.model.find({
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    });
    return docs.map(toDomain);
  }

  async listByRestaurantId(restaurantId: string): Promise<FeaturedSlot[]> {
    if (!Types.ObjectId.isValid(restaurantId)) return [];
    const docs = await this.model
      .find({ restaurantId: new Types.ObjectId(restaurantId) })
      .sort({ createdAt: -1 });
    return docs.map(toDomain);
  }

  async countActiveScope(
    scope: FeaturedScope,
    citySlug: string,
    category: string,
    now: Date,
  ): Promise<number> {
    return this.model.countDocuments({
      scope,
      citySlug,
      category: scope === 'category' ? category : '',
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gt: now },
    });
  }

  async setActive(id: string, isActive: boolean): Promise<FeaturedSlot | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { returnDocument: 'after' },
    );
    return doc ? toDomain(doc) : null;
  }

  async deleteManyByRestaurantId(restaurantId: string): Promise<void> {
    if (!Types.ObjectId.isValid(restaurantId)) return;
    await this.model.deleteMany({
      restaurantId: new Types.ObjectId(restaurantId),
    });
  }
}
