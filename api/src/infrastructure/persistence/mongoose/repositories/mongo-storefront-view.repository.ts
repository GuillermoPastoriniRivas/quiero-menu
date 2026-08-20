import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StorefrontViewRepository } from '../../../../domain/repositories/storefront-view.repository.js';
import {
  StorefrontViewModel,
  StorefrontViewDocument,
} from '../schemas/storefront-view.schema.js';

@Injectable()
export class MongoStorefrontViewRepository implements StorefrontViewRepository {
  constructor(
    @InjectModel(StorefrontViewModel.name)
    private readonly model: Model<StorefrontViewDocument>,
  ) {}

  async increment(restaurantId: string, date: string): Promise<void> {
    await this.model.updateOne(
      { restaurantId: new Types.ObjectId(restaurantId), date },
      { $inc: { views: 1 } },
      { upsert: true },
    );
  }

  async countViews(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<number> {
    const sinceStr = since.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    const rows = await this.model.aggregate([
      {
        $match: {
          restaurantId: new Types.ObjectId(restaurantId),
          date: { $gte: sinceStr, $lte: toStr },
        },
      },
      { $group: { _id: null, views: { $sum: '$views' } } },
    ]);
    return rows[0]?.views ?? 0;
  }
}
