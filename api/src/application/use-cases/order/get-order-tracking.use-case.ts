import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { PaymentMethodsConfig } from '../../../domain/entities/restaurant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { normalizeTrackingToken } from '../../common/generate-tracking-token.js';
import {
  RestaurantNotFoundError,
  OrderNotFoundError,
} from '../../../domain/errors/domain-errors.js';

export interface OrderTrackingOutput {
  order: {
    id: string;
    code: string;
    trackingToken: string;
    status: OrderStatus;
    deliveryType: DeliveryType;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    couponCode: string | null;
    paymentMethod: string;
    receiptUrl: string | null;
    notes: string;
    createdAt: Date;
    confirmedAt: Date | null;
    readyAt: Date | null;
    deliveredAt: Date | null;
  };
  items: OrderItem[];
  restaurant: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string;
    currency: string;
    paymentMethods: PaymentMethodsConfig;
    phone: string;
  };
}

export class GetOrderTrackingUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(
    slug: string,
    code: string,
  ): Promise<
    Result<OrderTrackingOutput, RestaurantNotFoundError | OrderNotFoundError>
  > {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const order = await this.orderRepo.findByCode(restaurant.id, code);
    if (!order) return err(new OrderNotFoundError());

    return this.buildOutput(order, restaurant);
  }

  async executeByToken(
    rawToken: string,
  ): Promise<Result<OrderTrackingOutput, OrderNotFoundError>> {
    const token = normalizeTrackingToken(rawToken);
    const order = await this.orderRepo.findByTrackingToken(token);
    if (!order || !order.trackingToken) return err(new OrderNotFoundError());

    const restaurant = await this.restaurantRepo.findById(order.restaurantId);
    if (!restaurant) return err(new OrderNotFoundError());

    return this.buildOutput(order, restaurant);
  }

  private async buildOutput(
    order: Order,
    restaurant: Restaurant,
  ): Promise<Result<OrderTrackingOutput, OrderNotFoundError>> {
    const items = await this.orderItemRepo.findByOrderId(order.id);

    return ok({
      order: {
        id: order.id,
        code: order.code,
        trackingToken: order.trackingToken,
        status: order.status,
        deliveryType: order.deliveryType,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        total: order.total,
        couponCode: order.couponCode,
        paymentMethod: order.paymentMethod,
        receiptUrl: order.receiptUrl,
        notes: order.notes,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        readyAt: order.readyAt,
        deliveredAt: order.deliveredAt,
      },
      items,
      restaurant: {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        logoUrl: restaurant.logoUrl,
        currency: restaurant.currency,
        paymentMethods: restaurant.paymentMethods,
        phone: restaurant.phone,
      },
    });
  }
}
