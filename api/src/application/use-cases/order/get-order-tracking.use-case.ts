import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { PaymentMethodsConfig } from '../../../domain/entities/restaurant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError, OrderNotFoundError } from '../../../domain/errors/domain-errors.js';

export interface OrderTrackingOutput {
  order: {
    id: string;
    code: string;
    status: OrderStatus;
    deliveryType: DeliveryType;
    subtotal: number;
    deliveryFee: number;
    total: number;
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

  async execute(slug: string, code: string): Promise<Result<OrderTrackingOutput, RestaurantNotFoundError | OrderNotFoundError>> {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const order = await this.orderRepo.findByCode(restaurant.id, code);
    if (!order) return err(new OrderNotFoundError());

    const items = await this.orderItemRepo.findByOrderId(order.id);

    return ok({
      order: {
        id: order.id,
        code: order.code,
        status: order.status,
        deliveryType: order.deliveryType,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
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
        currency: restaurant.currency,
        paymentMethods: restaurant.paymentMethods,
        phone: restaurant.phone,
      },
    });
  }
}