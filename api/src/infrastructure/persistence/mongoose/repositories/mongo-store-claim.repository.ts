import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StoreClaimRepository,
  CreateStoreClaimData,
} from '../../../../domain/repositories/store-claim.repository.js';
import {
  StoreClaim,
  StoreClaimStatus,
} from '../../../../domain/entities/store-claim.entity.js';
import {
  StoreClaimModel,
  StoreClaimDocument,
} from '../schemas/store-claim.schema.js';

function toDomain(doc: StoreClaimDocument): StoreClaim {
  const restaurantId =
    doc.restaurantId instanceof Types.ObjectId
      ? doc.restaurantId.toHexString()
      : String(doc.restaurantId);
  return new StoreClaim(
    doc._id.toHexString(),
    restaurantId,
    doc.name,
    doc.phone,
    doc.email,
    doc.message,
    doc.status as StoreClaimStatus,
    doc.createdAt,
    doc.reviewedAt ?? null,
  );
}

@Injectable()
export class MongoStoreClaimRepository implements StoreClaimRepository {
  constructor(
    @InjectModel(StoreClaimModel.name)
    private readonly model: Model<StoreClaimDocument>,
  ) {}

  async create(data: CreateStoreClaimData): Promise<StoreClaim> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
      status: 'pending',
    });
    return toDomain(doc);
  }

  async findById(id: string): Promise<StoreClaim | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findById(id);
    return doc ? toDomain(doc) : null;
  }

  async listByStatus(
    status: StoreClaimStatus,
    limit: number,
  ): Promise<StoreClaim[]> {
    const docs = await this.model
      .find({ status })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200));
    return docs.map(toDomain);
  }

  async findPendingByRestaurantId(restaurantId: string): Promise<StoreClaim[]> {
    const docs = await this.model
      .find({
        restaurantId: new Types.ObjectId(restaurantId),
        status: 'pending',
      })
      .sort({ createdAt: -1 });
    return docs.map(toDomain);
  }

  async updateStatus(
    id: string,
    status: StoreClaimStatus,
  ): Promise<StoreClaim | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { status, reviewedAt: new Date() } },
      { returnDocument: 'after' },
    );
    return doc ? toDomain(doc) : null;
  }
}
