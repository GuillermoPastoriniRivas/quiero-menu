import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CouponRepository } from '../../../../domain/repositories/coupon.repository.js';
import { Coupon } from '../../../../domain/entities/coupon.entity.js';
import { CouponModel, CouponDocument } from '../schemas/coupon.schema.js';
import { CouponMapper } from '../mappers/coupon.mapper.js';

@Injectable()
export class MongoCouponRepository implements CouponRepository {
  constructor(
    @InjectModel(CouponModel.name)
    private readonly model: Model<CouponDocument>,
  ) {}

  async create(data: Omit<Coupon, 'id' | 'createdAt'>): Promise<Coupon> {
    const doc = await this.model.create({
      ...data,
      code: data.code.toUpperCase(),
      restaurantId: new Types.ObjectId(data.restaurantId),
      expiresAt: data.expiresAt ?? null,
    });
    return CouponMapper.toDomain(doc);
  }

  async findByRestaurantId(restaurantId: string): Promise<Coupon[]> {
    const docs = await this.model.find({
      restaurantId: new Types.ObjectId(restaurantId),
    });
    return docs.map(CouponMapper.toDomain);
  }

  async findByCode(restaurantId: string, code: string): Promise<Coupon | null> {
    const doc = await this.model.findOne({
      restaurantId: new Types.ObjectId(restaurantId),
      code: code.toUpperCase(),
    });
    return doc ? CouponMapper.toDomain(doc) : null;
  }

  async findById(id: string): Promise<Coupon | null> {
    const doc = await this.model.findById(id);
    return doc ? CouponMapper.toDomain(doc) : null;
  }

  async update(
    id: string,
    data: Partial<Omit<Coupon, 'id' | 'restaurantId' | 'createdAt'>>,
  ): Promise<Coupon | null> {
    const update: Record<string, unknown> = { ...data };
    if (typeof update.code === 'string') {
      update.code = update.code.toUpperCase();
    }
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: update },
      { returnDocument: 'after' },
    );
    return doc ? CouponMapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteManyByRestaurantId(restaurantId: string): Promise<void> {
    await this.model.deleteMany({
      restaurantId: new Types.ObjectId(restaurantId),
    });
  }
}
