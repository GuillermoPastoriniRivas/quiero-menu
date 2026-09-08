import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderFeedbackRepository } from '../../../../domain/repositories/order-feedback.repository.js';
import {
  OrderFeedback,
  OrderFeedbackRating,
} from '../../../../domain/entities/order-feedback.entity.js';
import {
  OrderFeedbackModel,
  OrderFeedbackDocument,
} from '../schemas/order-feedback.schema.js';

function toDomain(doc: OrderFeedbackDocument): OrderFeedback {
  return new OrderFeedback(
    doc._id.toHexString(),
    doc.orderId instanceof Types.ObjectId
      ? doc.orderId.toHexString()
      : String(doc.orderId),
    doc.restaurantId instanceof Types.ObjectId
      ? doc.restaurantId.toHexString()
      : String(doc.restaurantId),
    doc.confirmedAt,
    (doc.rating as OrderFeedbackRating | null) ?? null,
    doc.onTime ?? null,
    doc.couponCode ?? null,
    doc.createdAt,
  );
}

@Injectable()
export class MongoOrderFeedbackRepository implements OrderFeedbackRepository {
  constructor(
    @InjectModel(OrderFeedbackModel.name)
    private readonly model: Model<OrderFeedbackDocument>,
  ) {}

  async create(
    data: Omit<OrderFeedback, 'id' | 'createdAt'>,
  ): Promise<OrderFeedback> {
    const doc = await this.model.create({
      orderId: new Types.ObjectId(data.orderId),
      restaurantId: new Types.ObjectId(data.restaurantId),
      confirmedAt: data.confirmedAt,
      rating: data.rating,
      onTime: data.onTime,
      couponCode: data.couponCode,
    });
    return toDomain(doc);
  }

  async findByOrderId(orderId: string): Promise<OrderFeedback | null> {
    if (!Types.ObjectId.isValid(orderId)) return null;
    const doc = await this.model.findOne({
      orderId: new Types.ObjectId(orderId),
    });
    return doc ? toDomain(doc) : null;
  }
}
