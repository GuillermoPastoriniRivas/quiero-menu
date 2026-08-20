import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import {
  OrderRepository,
  OrderFilters,
  PaginatedResult,
  CustomerSummary,
  CustomerFilters,
} from '../../../../domain/repositories/order.repository.js';
import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderStatus } from '../../../../domain/enums/order-status.enum.js';
import { OrderModel, OrderDocument } from '../schemas/order.schema.js';
import {
  OrderCounterModel,
  OrderCounterDocument,
} from '../schemas/order-counter.schema.js';
import { OrderMapper } from '../mappers/order.mapper.js';

@Injectable()
export class MongoOrderRepository implements OrderRepository {
  constructor(
    @InjectModel(OrderModel.name) private readonly model: Model<OrderDocument>,
    @InjectModel(OrderCounterModel.name)
    private readonly counterModel: Model<OrderCounterDocument>,
  ) {}

  async create(
    data: Omit<
      Order,
      'id' | 'createdAt' | 'confirmedAt' | 'readyAt' | 'deliveredAt'
    >,
  ): Promise<Order> {
    const doc = await this.model.create({
      ...data,
      restaurantId: new Types.ObjectId(data.restaurantId),
      deliveryZoneId: data.deliveryZoneId
        ? new Types.ObjectId(data.deliveryZoneId)
        : null,
    });
    return OrderMapper.toDomain(doc);
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await this.model.findById(id);
    return doc ? OrderMapper.toDomain(doc) : null;
  }

  async findByCode(restaurantId: string, code: string): Promise<Order | null> {
    const doc = await this.model.findOne({
      restaurantId: new Types.ObjectId(restaurantId),
      code,
    });
    return doc ? OrderMapper.toDomain(doc) : null;
  }

  async findByFilters(filters: OrderFilters): Promise<PaginatedResult<Order>> {
    const query: Record<string, unknown> = {
      restaurantId: new Types.ObjectId(filters.restaurantId),
    };
    if (filters.status) query.status = filters.status;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(query),
    ]);

    return {
      data: docs.map(OrderMapper.toDomain),
      meta: { total, page, pages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    timestamps?: Partial<
      Pick<Order, 'confirmedAt' | 'readyAt' | 'deliveredAt'>
    >,
  ): Promise<Order | null> {
    const update: Record<string, unknown> = { status };
    if (timestamps) Object.assign(update, timestamps);
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: update },
      { returnDocument: 'after' },
    );
    return doc ? OrderMapper.toDomain(doc) : null;
  }

  async updateReceiptUrl(
    id: string,
    receiptUrl: string,
  ): Promise<Order | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { receiptUrl } },
      { returnDocument: 'after' },
    );
    return doc ? OrderMapper.toDomain(doc) : null;
  }

  async countByRestaurantIdSince(
    restaurantId: string,
    since: Date,
  ): Promise<number> {
    return this.model.countDocuments({
      restaurantId: new Types.ObjectId(restaurantId),
      createdAt: { $gte: since },
    });
  }

  async findNthOrderCreatedAt(
    restaurantId: string,
    since: Date,
    n: number,
  ): Promise<Date | null> {
    const result = await this.model
      .find({
        restaurantId: new Types.ObjectId(restaurantId),
        createdAt: { $gte: since },
      })
      .sort({ createdAt: 1 })
      .skip(n - 1)
      .limit(1)
      .select('createdAt')
      .lean();
    return result[0]?.createdAt ?? null;
  }

  async generateNextCode(restaurantId: string): Promise<string> {
    const counter = await this.counterModel.findOneAndUpdate(
      { restaurantId: new Types.ObjectId(restaurantId) },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
    const seq = counter.seq;
    return `PED-${String(seq).padStart(4, '0')}`;
  }

  async listCustomers(
    filters: CustomerFilters,
  ): Promise<PaginatedResult<CustomerSummary>> {
    const restaurantId = new Types.ObjectId(filters.restaurantId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 30;
    const skip = (page - 1) * limit;

    const match: Record<string, unknown> = { restaurantId };
    if (filters.search) {
      const q = filters.search.trim();
      if (q) {
        const regex = { $regex: q, $options: 'i' };
        match.$or = [{ customerPhone: regex }, { customerName: regex }];
      }
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customerPhone',
          name: { $first: '$customerName' },
          address: { $first: '$customerAddress' },
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 0, '$total'],
            },
          },
          lastOrderAt: { $first: '$createdAt' },
          lastOrderCode: { $first: '$code' },
        },
      },
      { $sort: { lastOrderAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ] as PipelineStage[];

    const [rows, countResult] = await Promise.all([
      this.model.aggregate(pipeline),
      this.model.aggregate([
        { $match: match },
        { $group: { _id: '$customerPhone' } },
        { $count: 'total' },
      ]),
    ]);

    const total = countResult[0]?.total ?? 0;
    return {
      data: rows.map((r) => ({
        phone: r._id as string,
        name: (r.name as string) ?? '',
        address: (r.address as string | null) ?? null,
        orderCount: r.orderCount as number,
        totalSpent: r.totalSpent as number,
        lastOrderAt: r.lastOrderAt as Date,
        lastOrderCode: r.lastOrderCode as string,
      })),
      meta: { total, page, pages: Math.ceil(total / limit) },
    };
  }

  async findOrdersByCustomer(
    restaurantId: string,
    phone: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<Order>> {
    const match = {
      restaurantId: new Types.ObjectId(restaurantId),
      customerPhone: phone,
    };
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.model.countDocuments(match),
    ]);
    return {
      data: docs.map(OrderMapper.toDomain),
      meta: { total, page, pages: Math.ceil(total / limit) },
    };
  }

  async deleteManyByRestaurantId(restaurantId: string): Promise<void> {
    await this.model.deleteMany({
      restaurantId: new Types.ObjectId(restaurantId),
    });
  }
}
