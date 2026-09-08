import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderFeedbackRepository } from '../../../domain/repositories/order-feedback.repository.js';
import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import {
  OrderFeedback,
  OrderFeedbackRating,
} from '../../../domain/entities/order-feedback.entity.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { CouponType } from '../../../domain/enums/coupon-type.enum.js';
import { RealtimeGatewayPort } from '../../ports/realtime-gateway.port.js';
import { PushServicePort } from '../../ports/push-service.port.js';
import { Result, ok, err } from '../../common/result.js';
import {
  normalizeTrackingToken,
  generateTrackingToken,
} from '../../common/generate-tracking-token.js';
import {
  OrderNotFoundError,
  OrderNotDeliveredError,
} from '../../../domain/errors/domain-errors.js';

export interface ConfirmDeliveryInput {
  rating?: OrderFeedbackRating;
  onTime?: boolean;
}

export interface ConfirmDeliveryOutput {
  orderId: string;
  code: string;
  status: OrderStatus;
  confirmedAt: Date;
  couponCode: string;
  rating: OrderFeedbackRating | null;
  onTime: boolean | null;
}

const LOYALTY_DISCOUNT_PERCENT = 10;
const COUPON_VALID_DAYS = 30;

/**
 * El oráculo: el COMENSAL confirma la entrega (no el local, que es quien
 * paga en función de la métrica). El beneficio que lo incentiva es un cupón
 * de 10% off para su próximo pedido, generado en el momento.
 *
 * - Solo DELIVERING o DELIVERED. Si está en camino, la confirmación también
 *   cierra el pedido como entregado (la palabra del comensal manda).
 * - Idempotente: si ya confirmó, devuelve el feedback existente.
 */
export class ConfirmDeliveryUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly feedbackRepo: OrderFeedbackRepository,
    private readonly couponRepo: CouponRepository,
    private readonly gateway: RealtimeGatewayPort,
    private readonly pushService: PushServicePort,
  ) {}

  async execute(
    rawToken: string,
    input: ConfirmDeliveryInput,
  ): Promise<
    Result<ConfirmDeliveryOutput, OrderNotFoundError | OrderNotDeliveredError>
  > {
    const token = normalizeTrackingToken(rawToken);
    const order = await this.orderRepo.findByTrackingToken(token);
    if (!order || !order.trackingToken) return err(new OrderNotFoundError());

    if (
      order.status !== OrderStatus.DELIVERING &&
      order.status !== OrderStatus.DELIVERED
    ) {
      return err(new OrderNotDeliveredError());
    }

    const existing = await this.feedbackRepo.findByOrderId(order.id);
    if (existing) {
      return ok({
        orderId: order.id,
        code: order.code,
        status: order.status,
        confirmedAt: existing.confirmedAt,
        couponCode: existing.couponCode ?? '',
        rating: existing.rating,
        onTime: existing.onTime,
      });
    }

    let status: OrderStatus = order.status;
    if (order.status === OrderStatus.DELIVERING) {
      const updated = await this.orderRepo.updateStatus(
        order.id,
        OrderStatus.DELIVERED,
        { deliveredAt: new Date() },
      );
      if (updated) {
        status = updated.status;
        this.gateway.emitToRestaurant(
          order.restaurantId,
          'order.updated',
          updated,
        );
        this.gateway.emitToOrderRoom(
          order.restaurantId,
          order.code,
          'order.updated',
          updated,
        );
        this.pushService
          .sendToOrder(order.trackingToken, {
            title: `Pedido #${order.code}`,
            body: 'Tu pedido fue entregado',
            tag: `order-${order.id}`,
          })
          .catch(() => {});
      }
    }

    const couponCode = await this.mintCoupon(order.restaurantId);
    const now = new Date();
    const feedback: OrderFeedback = await this.feedbackRepo.create({
      orderId: order.id,
      restaurantId: order.restaurantId,
      confirmedAt: now,
      rating: input.rating ?? null,
      onTime: input.onTime ?? null,
      couponCode,
    });

    return ok({
      orderId: order.id,
      code: order.code,
      status,
      confirmedAt: feedback.confirmedAt,
      couponCode: feedback.couponCode ?? '',
      rating: feedback.rating,
      onTime: feedback.onTime,
    });
  }

  private async mintCoupon(restaurantId: string): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = `VUELVE-${generateTrackingToken().slice(0, 6)}`;
      const existing = await this.couponRepo.findByCode(restaurantId, code);
      if (existing) continue;
      await this.couponRepo.create({
        restaurantId,
        code,
        type: CouponType.PERCENTAGE,
        value: LOYALTY_DISCOUNT_PERCENT,
        minSubtotal: 0,
        isActive: true,
        expiresAt: new Date(
          Date.now() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000,
        ),
      });
      return code;
    }
    // Colisión improbable x3: fallback determinístico por timestamp.
    const fallback = `VUELVE-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    await this.couponRepo.create({
      restaurantId,
      code: fallback,
      type: CouponType.PERCENTAGE,
      value: LOYALTY_DISCOUNT_PERCENT,
      minSubtotal: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + COUPON_VALID_DAYS * 24 * 60 * 60 * 1000),
    });
    return fallback;
  }
}
