import { GetOrderTrackingUseCase } from './get-order-tracking.use-case.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';

function makeOrder(): Order {
  return new Order(
    'o1',
    'r1',
    'PED-0001',
    'K4MNPQ7X',
    OrderStatus.NEW,
    'Juan',
    '5491100000000',
    'Calle Falsa 123',
    null,
    null,
    DeliveryType.DELIVERY,
    500,
    1000,
    0,
    1500,
    null,
    'cash',
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

function makeRestaurant(): Restaurant {
  return new Restaurant(
    'r1',
    'mi-resto',
    'Mi Resto',
    '',
    '',
    '',
    '',
    '',
    'AR',
    null,
    '+5491100000000',
    'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: false, transferEnabled: true },
    { primaryColor: '#000000' },
    new Date(),
    new Date(),
  );
}

describe('GetOrderTrackingUseCase', () => {
  function build() {
    const order = makeOrder();
    const restaurant = makeRestaurant();
    const orderRepo = {
      findByCode: jest.fn().mockResolvedValue(order),
      findByTrackingToken: jest.fn().mockResolvedValue(order),
    };
    const restaurantRepo = {
      findBySlug: jest.fn().mockResolvedValue(restaurant),
      findById: jest.fn().mockResolvedValue(restaurant),
    };
    const orderItemRepo = { findByOrderId: jest.fn().mockResolvedValue([]) };
    const useCase = new GetOrderTrackingUseCase(
      orderRepo as any,
      orderItemRepo as any,
      restaurantRepo as any,
    );
    return { useCase, orderRepo, restaurantRepo, order, restaurant };
  }

  it('resuelve el tracking por slug + code (legacy)', async () => {
    const { useCase, orderRepo, restaurantRepo } = build();
    const result = await useCase.execute('mi-resto', 'PED-0001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.order.code).toBe('PED-0001');
      expect(result.value.order.trackingToken).toBe('K4MNPQ7X');
      expect(result.value.restaurant.slug).toBe('mi-resto');
    }
    expect(restaurantRepo.findBySlug).toHaveBeenCalledWith('mi-resto');
    expect(orderRepo.findByCode).toHaveBeenCalledWith('r1', 'PED-0001');
  });

  it('resuelve el tracking por token sin slug', async () => {
    const { useCase, orderRepo, restaurantRepo } = build();
    const result = await useCase.executeByToken('k4mnpq7x');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.order.trackingToken).toBe('K4MNPQ7X');
      expect(result.value.restaurant.slug).toBe('mi-resto');
    }
    expect(restaurantRepo.findBySlug).not.toHaveBeenCalled();
    expect(restaurantRepo.findById).toHaveBeenCalledWith('r1');
    expect(orderRepo.findByTrackingToken).toHaveBeenCalledWith('K4MNPQ7X');
  });

  it('normaliza el token a mayúsculas', async () => {
    const { useCase, orderRepo } = build();
    await useCase.executeByToken('  k4mnpq7x ');
    expect(orderRepo.findByTrackingToken).toHaveBeenCalledWith('K4MNPQ7X');
  });

  it('rechaza con OrderNotFoundError cuando el token no existe', async () => {
    const { useCase, orderRepo } = build();
    orderRepo.findByTrackingToken.mockResolvedValue(null);
    const result = await useCase.executeByToken('ZZZZZZZZ');
    expect(result.ok).toBe(false);
  });

  it('rechaza con OrderNotFoundError cuando la order no tiene token (sin backfill)', async () => {
    const sinToken = makeOrder();
    const orderRepo = {
      findByTrackingToken: jest.fn().mockResolvedValue(sinToken),
    };
    const restaurantRepo = {
      findById: jest.fn().mockResolvedValue(makeRestaurant()),
    };
    const conTokenVacio = new Order(
      sinToken.id,
      sinToken.restaurantId,
      sinToken.code,
      '',
      sinToken.status,
      sinToken.customerName,
      sinToken.customerPhone,
      sinToken.customerAddress,
      sinToken.customerLatitude,
      sinToken.customerLongitude,
      sinToken.deliveryType,
      sinToken.deliveryFee,
      sinToken.subtotal,
      sinToken.discount,
      sinToken.total,
      sinToken.couponCode,
      sinToken.paymentMethod,
      sinToken.receiptUrl,
      sinToken.notes,
      sinToken.source,
      sinToken.createdAt,
      sinToken.confirmedAt,
      sinToken.readyAt,
      sinToken.deliveredAt,
      sinToken.statusHistory,
    );
    orderRepo.findByTrackingToken.mockResolvedValue(conTokenVacio);
    const caso = new GetOrderTrackingUseCase(
      orderRepo as any,
      { findByOrderId: jest.fn() } as any,
      restaurantRepo as any,
    );
    const result = await caso.executeByToken('K4MNPQ7X');
    expect(result.ok).toBe(false);
  });

  it('rechaza con RestaurantNotFoundError cuando el slug no existe', async () => {
    const { useCase, restaurantRepo } = build();
    restaurantRepo.findBySlug.mockResolvedValue(null);
    const result = await useCase.execute('otro-resto', 'PED-0001');
    expect(result.ok).toBe(false);
  });
});
