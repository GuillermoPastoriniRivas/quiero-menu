import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { RealtimeGatewayPort } from '../../ports/realtime-gateway.port.js';
import { PushServicePort } from '../../ports/push-service.port.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { Result, ok, err } from '../../common/result.js';
import {
  OrderNotFoundError,
  InvalidOrderTransitionError,
  CrossRestaurantAccessError,
} from '../../../domain/errors/domain-errors.js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.NEW]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [
    OrderStatus.DELIVERING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
};

const STATUS_MESSAGES: Record<string, string> = {
  [OrderStatus.PREPARING]: 'Estamos preparando tu pedido',
  [OrderStatus.READY]: 'Tu pedido está listo',
  [OrderStatus.DELIVERING]: 'Tu pedido va en camino',
  [OrderStatus.DELIVERED]: 'Tu pedido fue entregado',
  [OrderStatus.CANCELLED]: 'Tu pedido fue cancelado',
};

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly gateway: RealtimeGatewayPort,
    private readonly pushService: PushServicePort,
  ) {}

  async execute(
    id: string,
    restaurantId: string,
    newStatus: OrderStatus,
  ): Promise<
    Result<
      Order,
      | OrderNotFoundError
      | InvalidOrderTransitionError
      | CrossRestaurantAccessError
    >
  > {
    const order = await this.orderRepo.findById(id);
    if (!order) return err(new OrderNotFoundError());
    if (order.restaurantId !== restaurantId)
      return err(new CrossRestaurantAccessError());

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return err(new InvalidOrderTransitionError(order.status, newStatus));
    }

    const timestamps: Record<string, Date> = {};
    if (newStatus === OrderStatus.NEW) timestamps.confirmedAt = new Date();
    if (newStatus === OrderStatus.READY) timestamps.readyAt = new Date();
    if (newStatus === OrderStatus.DELIVERED)
      timestamps.deliveredAt = new Date();

    const updated = await this.orderRepo.updateStatus(
      id,
      newStatus,
      timestamps,
    );
    if (!updated) return err(new OrderNotFoundError());

    this.gateway.emitToRestaurant(order.restaurantId, 'order.updated', updated);
    this.gateway.emitToOrderRoom(
      order.restaurantId,
      order.code,
      'order.updated',
      updated,
    );

    const msg = STATUS_MESSAGES[newStatus];
    if (msg) {
      this.pushService
        .sendToOrder(order.code, {
          title: `Pedido #${order.code}`,
          body: msg,
          tag: `order-${order.id}`,
        })
        .catch(() => {});
    }

    return ok(updated);
  }
}
