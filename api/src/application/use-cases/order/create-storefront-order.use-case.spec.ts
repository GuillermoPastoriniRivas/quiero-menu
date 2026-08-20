import { CreateStorefrontOrderUseCase } from './create-storefront-order.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import {
  RestaurantClosedError,
  RestaurantPausedError,
} from '../../../domain/errors/domain-errors.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';

function makeRestaurant(
  status: RestaurantStatus = RestaurantStatus.ACTIVE,
  timezone = 'America/Argentina/Buenos_Aires',
): Restaurant {
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
    timezone,
    'ARS',
    status,
    null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#000000' },
    new Date(),
    new Date(),
  );
}

function makeHours(rows: Partial<OperatingHours>[]): OperatingHours[] {
  return rows.map(
    (h, i) =>
      new OperatingHours(
        String(i),
        'r1',
        h.dayOfWeek ?? 0,
        h.opensAt ?? '09:00',
        h.closesAt ?? '22:00',
        h.isClosed ?? false,
      ),
  );
}

function makeOrder(): Order {
  return new Order(
    'o1',
    'r1',
    'A1',
    OrderStatus.NEW,
    'Juan',
    '5491100000000',
    null,
    null,
    null,
    DeliveryType.PICKUP,
    null,
    0,
    0,
    0,
    0,
    null,
    'cash',
    null,
    '',
    OrderSource.STOREFRONT,
    new Date(),
    null,
    null,
    null,
  );
}

describe('CreateStorefrontOrderUseCase — guard de horarios', () => {
  function buildUseCase(
    overrides: {
      status?: RestaurantStatus;
      hours?: OperatingHours[];
    } = {},
  ) {
    const restaurant = makeRestaurant(overrides.status);
    const restaurantRepo = {
      findBySlug: jest.fn().mockResolvedValue(restaurant),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const hoursRepo = {
      findByRestaurantId: jest.fn().mockResolvedValue(overrides.hours ?? []),
      upsertBulk: jest.fn(),
      deleteByRestaurantId: jest.fn(),
    };

    const stub = () => jest.fn();
    const useCase = new CreateStorefrontOrderUseCase(
      {
        create: jest.fn().mockResolvedValue(makeOrder()),
        generateNextCode: jest.fn().mockResolvedValue('A1'),
      } as any,
      { createBulk: jest.fn().mockResolvedValue([]) } as any,
      restaurantRepo as any,
      hoursRepo as any,
      { findById: stub() } as any,
      { findById: stub() } as any,
      { findById: stub() } as any,
      { findById: stub() } as any,
      { findByCode: stub() } as any,
      { emitToRestaurant: stub() } as any,
      { sendToRestaurant: jest.fn().mockResolvedValue(undefined) } as any,
    );

    return { useCase, restaurantRepo, hoursRepo };
  }

  const input = {
    items: [],
    customerName: 'Juan',
    customerPhone: '5491100000000',
    deliveryType: DeliveryType.PICKUP,
    paymentMethod: 'cash',
    notes: '',
  };

  it('rechaza con RestaurantClosedError cuando el local está cerrado por horario', async () => {
    // Jueves 2026-08-20 14:00 UTC = 11:00 ART, abierto de 09:00 a 11:00 (11:00 no es < 11:00)
    const { useCase } = buildUseCase({
      hours: makeHours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '11:00' }]),
    });
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));
    try {
      const result = await useCase.execute('mi-resto', input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(RestaurantClosedError);
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it('rechaza cuando está paused (override manual)', async () => {
    const { useCase } = buildUseCase({
      status: RestaurantStatus.PAUSED,
      hours: makeHours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]),
    });
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));
    try {
      const result = await useCase.execute('mi-resto', input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(RestaurantPausedError);
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it('deja pasar el pedido cuando está dentro del horario', async () => {
    const { useCase, restaurantRepo } = buildUseCase({
      hours: makeHours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]),
    });
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));
    try {
      const result = await useCase.execute('mi-resto', input);
      // Sin items no debería llegar a crear nada, pero el guard de horarios no debe bloquear.
      expect(result.ok).toBe(true);
      expect(restaurantRepo.findBySlug).toHaveBeenCalledWith('mi-resto');
    } finally {
      jest.useRealTimers();
    }
  });
});
