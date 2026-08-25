import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AnalyticsRepository,
  SalesSummary,
  DailySalesPoint,
  TopItem,
  HourlySalesPoint,
  StatusCount,
  StageTiming,
} from '../../../../domain/repositories/analytics.repository.js';
import { OrderModel, OrderDocument } from '../schemas/order.schema.js';
import {
  OrderItemModel,
  OrderItemDocument,
} from '../schemas/order-item.schema.js';

const CANCELLED = 'cancelled';

@Injectable()
export class MongoAnalyticsRepository implements AnalyticsRepository {
  constructor(
    @InjectModel(OrderModel.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(OrderItemModel.name)
    private readonly orderItemModel: Model<OrderItemDocument>,
  ) {}

  private match(restaurantId: string, since: Date, to: Date) {
    return {
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: since, $lte: to },
    };
  }

  private revenueCond() {
    return { $cond: [{ $ne: ['$status', CANCELLED] }, '$total', 0] };
  }

  async getSummary(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<SalesSummary> {
    const rows = await this.orderModel.aggregate([
      { $match: this.match(restaurantId, since, to) },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: this.revenueCond() },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', CANCELLED] }, 1, 0] },
          },
        },
      },
    ]);
    const row = rows[0];
    if (!row) return { revenue: 0, orders: 0, avgTicket: 0, cancelled: 0 };
    const orders = row.orders as number;
    const revenue = row.revenue as number;
    const cancelled = row.cancelled as number;
    const effective = Math.max(0, orders - cancelled);
    return {
      revenue,
      orders,
      cancelled,
      avgTicket: effective > 0 ? revenue / effective : 0,
    };
  }

  async getDailySales(
    restaurantId: string,
    since: Date,
    to: Date,
    timezone: string,
  ): Promise<DailySalesPoint[]> {
    const rows = await this.orderModel.aggregate([
      { $match: this.match(restaurantId, since, to) },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone,
            },
          },
          revenue: { $sum: this.revenueCond() },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({
      date: r._id as string,
      revenue: r.revenue as number,
      orders: r.orders as number,
    }));
  }

  async getTopItems(
    restaurantId: string,
    since: Date,
    to: Date,
    limit: number,
  ): Promise<TopItem[]> {
    const rows = await this.orderModel.aggregate([
      { $match: this.match(restaurantId, since, to) },
      { $match: { status: { $ne: CANCELLED } } },
      {
        $lookup: {
          from: this.orderItemModel.collection.name,
          localField: '_id',
          foreignField: 'orderId',
          as: 'items',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.menuItemName' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { quantity: -1, revenue: -1 } },
      { $limit: limit },
    ]);
    return rows.map((r) => ({
      menuItemId: r._id.toHexString(),
      name: r.name as string,
      quantity: r.quantity as number,
      revenue: r.revenue as number,
    }));
  }

  async getSalesByHour(
    restaurantId: string,
    since: Date,
    to: Date,
    timezone: string,
  ): Promise<HourlySalesPoint[]> {
    const rows = await this.orderModel.aggregate([
      { $match: this.match(restaurantId, since, to) },
      {
        $group: {
          _id: {
            $dateToString: { format: '%H', date: '$createdAt', timezone },
          },
          orders: { $sum: 1 },
          revenue: { $sum: this.revenueCond() },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({
      hour: Number(r._id),
      orders: r.orders as number,
      revenue: r.revenue as number,
    }));
  }

  async getStatusDistribution(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<StatusCount[]> {
    const rows = await this.orderModel.aggregate([
      { $match: this.match(restaurantId, since, to) },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return rows.map((r) => ({
      status: r._id as string,
      count: r.count as number,
    }));
  }

  async getStatusTimings(
    restaurantId: string,
    since: Date,
    to: Date,
  ): Promise<StageTiming[]> {
    const rows = await this.orderModel
      .find(this.match(restaurantId, since, to))
      .select('statusHistory')
      .lean();

    interface Bucket {
      count: number;
      sumMs: number;
      minMs: number;
      maxMs: number;
    }
    const buckets = new Map<string, Bucket>();

    for (const row of rows) {
      const history = (row.statusHistory ?? [])
        .filter((h) => h && h.status && h.at)
        .map((h) => ({
          status: h.status,
          at: new Date(h.at).getTime(),
        }))
        .sort((a, b) => a.at - b.at);

      const uniq: { status: string; at: number }[] = [];
      for (const h of history) {
        const last = uniq[uniq.length - 1];
        if (last && last.status === h.status) {
          last.at = h.at;
          continue;
        }
        uniq.push(h);
      }

      for (let i = 1; i < uniq.length; i++) {
        const delta = uniq[i].at - uniq[i - 1].at;
        if (delta < 0) continue;
        const key = `${uniq[i - 1].status}|${uniq[i].status}`;
        const b = buckets.get(key) ?? {
          count: 0,
          sumMs: 0,
          minMs: Infinity,
          maxMs: 0,
        };
        b.count += 1;
        b.sumMs += delta;
        b.minMs = Math.min(b.minMs, delta);
        b.maxMs = Math.max(b.maxMs, delta);
        buckets.set(key, b);
      }
    }

    return [...buckets.entries()]
      .map(([key, b]) => {
        const [from, toStatus] = key.split('|');
        return {
          from,
          to: toStatus,
          count: b.count,
          avgMinutes: +(b.sumMs / b.count / 60000).toFixed(1),
          minMinutes: +(b.minMs / 60000).toFixed(1),
          maxMinutes: +(b.maxMs / 60000).toFixed(1),
        };
      })
      .sort((a, b) => b.count - a.count);
  }
}
