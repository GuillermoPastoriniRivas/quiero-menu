import { ConfirmDeliveryUseCase } from './confirm-delivery.use-case.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import {
  OrderNotFoundError,
  OrderNotDeliveredError,
} from '../../../domain/errors/domain-errors.js';

function makeOrder(status: OrderStatus) {
  return new Order(
    'o1',
    'r1',
    'PED-0001',
    'ABCDEFGH',
    status,
    'Juan',
    '+59899000000',
    null,
    null,
    null,
    DeliveryType.DELIVERY,
    0,
    10000,
    0,
    10000,
    null,
    'efectivo',
    null,
    '',
    OrderSource.STOREFRONT,
    new Date(),
    null,
    null,
    null,
    [],
  );
}

function deps(order: Order | null, feedback: any = null) {
  const orderRepo: any = {
    findByTrackingToken: jest.fn().mockResolvedValue(order),
    updateStatus: jest.fn((_id: string, status: OrderStatus) =>
      Promise.resolve({
        ...makeOrder(status),
        status,
      }),
    ),
  };
  const feedbackRepo: any = {
    findByOrderId: jest.fn().mockResolvedValue(feedback),
    create: jest.fn((d: any) => Promise.resolve({ id: 'f1', ...d })),
  };
  const couponRepo: any = {
    findByCode: jest.fn().mockResolvedValue(null),
    create: jest.fn((d: any) => Promise.resolve({ id: 'c1', ...d })),
  };
  const gateway: any = {
    emitToRestaurant: jest.fn(),
    emitToOrderRoom: jest.fn(),
  };
  const pushService: any = {
    sendToOrder: jest.fn().mockResolvedValue(undefined),
  };
  const uc = new ConfirmDeliveryUseCase(
    orderRepo,
    feedbackRepo,
    couponRepo,
    gateway,
    pushService,
  );
  return { uc, orderRepo, feedbackRepo, couponRepo, gateway, pushService };
}

describe('ConfirmDeliveryUseCase', () => {
  it('404 si el token no existe', async () => {
    const { uc } = deps(null);
    const out = await uc.execute('ZZZZZZZZ', {});
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(OrderNotFoundError);
  });

  it('rechaza pedidos que todavía no salieron (new/preparing/ready/cancelled)', async () => {
    for (const status of [
      OrderStatus.NEW,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.CANCELLED,
    ]) {
      const { uc } = deps(makeOrder(status));
      const out = await uc.execute('ABCDEFGH', {});
      expect(out.ok).toBe(false);
      if (!out.ok) expect(out.error).toBeInstanceOf(OrderNotDeliveredError);
    }
  });

  it('confirma un pedido en camino, lo marca entregado y emite cupón', async () => {
    const { uc, orderRepo, couponRepo, gateway } = deps(
      makeOrder(OrderStatus.DELIVERING),
    );
    const out = await uc.execute('ABCDEFGH', { rating: 'up', onTime: true });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.status).toBe(OrderStatus.DELIVERED);
    expect(out.value.couponCode).toMatch(/^VUELVE-/);
    expect(out.value.rating).toBe('up');
    expect(orderRepo.updateStatus).toHaveBeenCalledWith(
      'o1',
      OrderStatus.DELIVERED,
      expect.objectContaining({ deliveredAt: expect.any(Date) }),
    );
    expect(couponRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: 'r1',
        type: 'percentage',
        value: 10,
      }),
    );
    expect(gateway.emitToRestaurant).toHaveBeenCalled();
  });

  it('es idempotente: segunda confirmación devuelve lo mismo sin duplicar', async () => {
    const existing = {
      id: 'f1',
      confirmedAt: new Date(),
      rating: 'up',
      onTime: true,
      couponCode: 'VUELVE-ABC123',
    };
    const { uc, couponRepo } = deps(makeOrder(OrderStatus.DELIVERED), existing);
    const out = await uc.execute('ABCDEFGH', {});
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.couponCode).toBe('VUELVE-ABC123');
    expect(couponRepo.create).not.toHaveBeenCalled();
  });
});
