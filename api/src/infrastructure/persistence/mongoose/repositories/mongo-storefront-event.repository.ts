import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StorefrontEventRepository } from '../../../../domain/repositories/storefront-event.repository.js';
import { StorefrontEventType } from '../../../../domain/enums/storefront-event-type.enum.js';
import {
  StorefrontEventModel,
  StorefrontEventDocument,
} from '../schemas/storefront-event.schema.js';

@Injectable()
export class MongoStorefrontEventRepository implements StorefrontEventRepository {
  constructor(
    @InjectModel(StorefrontEventModel.name)
    private readonly model: Model<StorefrontEventDocument>,
  ) {}

  async increment(
    restaurantId: string,
    date: string,
    type: StorefrontEventType,
  ): Promise<void> {
    await this.model.updateOne(
      {
        restaurantId: new Types.ObjectId(restaurantId),
        date,
        type,
      },
      { $inc: { count: 1 } },
      { upsert: true },
    );
  }

  async countByType(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<{ whatsapp: number; maps: number; instagram: number }> {
    const sinceStr = since.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    const rows = await this.model.aggregate([
      {
        $match: {
          restaurantId: new Types.ObjectId(restaurantId),
          date: { $gte: sinceStr, $lte: toStr },
        },
      },
      { $group: { _id: '$type', count: { $sum: '$count' } } },
    ]);
    const byType = new Map(rows.map((r) => [r._id as string, r.count]));
    return {
      whatsapp: byType.get('whatsapp') ?? 0,
      maps: byType.get('maps') ?? 0,
      instagram: byType.get('instagram') ?? 0,
    };
  }

  async deleteManyByRestaurantId(restaurantId: string): Promise<void> {
    if (!Types.ObjectId.isValid(restaurantId)) return;
    await this.model.deleteMany({
      restaurantId: new Types.ObjectId(restaurantId),
    });
  }
}
