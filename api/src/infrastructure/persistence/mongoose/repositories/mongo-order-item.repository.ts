import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderItemRepository } from '../../../../domain/repositories/order-item.repository.js';
import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { OrderItemModel, OrderItemDocument } from '../schemas/order-item.schema.js';
import { OrderItemMapper } from '../mappers/order-item.mapper.js';

@Injectable()
export class MongoOrderItemRepository implements OrderItemRepository {
  constructor(@InjectModel(OrderItemModel.name) private readonly model: Model<OrderItemDocument>) {}

  async createBulk(items: Omit<OrderItem, 'id'>[]): Promise<OrderItem[]> {
    const docs = await this.model.insertMany(
      items.map((item) => ({
        ...item,
        orderId: new Types.ObjectId(item.orderId),
        menuItemId: new Types.ObjectId(item.menuItemId),
        variantId: item.variantId ? new Types.ObjectId(item.variantId) : null,
      })),
    );
    return docs.map(OrderItemMapper.toDomain);
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const docs = await this.model.find({ orderId: new Types.ObjectId(orderId) });
    return docs.map(OrderItemMapper.toDomain);
  }
}
