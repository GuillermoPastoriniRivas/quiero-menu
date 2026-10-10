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
    'K4MNPQ7X',
    OrderStatus.NEW,
    'Juan',
    '5491100000000',
    null,
    null,
    null,
    DeliveryType.PICKUP,
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
    [],
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
    const orderRepo = {
      create: jest.fn().mockResolvedValue(makeOrder()),
      generateNextCode: jest.fn().mockResolvedValue('A1'),
      findByTrackingToken: jest.fn().mockResolvedValue(null),
    };
    const useCase = new CreateStorefrontOrderUseCase(
      orderRepo as any,
      { createBulk: jest.fn().mockResolvedValue([]) } as any,
      restaurantRepo as any,
      hoursRepo as any,
      { findById: stub() } as any,
      { findById: stub() } as any,
      { findById: stub() } as any,
      { findByCode: stub() } as any,
      { emitToRestaurant: stub() } as any,
      { sendToRestaurant: jest.fn().mockResolvedValue(undefined) } as any,
    );

    return { useCase, orderRepo, restaurantRepo, hoursRepo };
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

  it('genera un trackingToken único al crear el pedido', async () => {
    const { useCase, orderRepo } = buildUseCase({
      hours: makeHours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]),
    });
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));
    try {
      await useCase.execute('mi-resto', input);
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          trackingToken: expect.stringMatching(/^[0-9A-HJKMNP-TV-Z]{8}$/),
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('CreateStorefrontOrderUseCase — límites de grupos de opciones', () => {
  const options: Record<string, unknown> = {
    o1: {
      id: 'o1',
      itemId: 'm1',
      variantId: null,
      name: 'Chocolate',
      priceDelta: 0,
      optionGroup: 'Clasicos',
      isAvailable: true,
    },
    o2: {
      id: 'o2',
      itemId: 'm1',
      variantId: null,
      name: 'Frutilla',
      priceDelta: 0,
      optionGroup: 'Clasicos',
      isAvailable: true,
    },
  };

  function makeMenuItem(optionGroups: unknown[]) {
    return {
      id: 'm1',
      restaurantId: 'r1',
      categoryId: 'c1',
      name: '1 Kg',
      description: '',
      basePrice: 15300,
      imageUrl: '',
      displayOrder: 0,
      isAvailable: true,
      isVisible: true,
      itemType: 'simple',
      optionGroups,
    };
  }

  function build(
    optionGroups: unknown[],
    variants: unknown[] = [],
    availableOptions: unknown[] = Object.values(options),
  ) {
    const restaurant = makeRestaurant();
    const orderRepo = {
      create: jest.fn().mockResolvedValue(makeOrder()),
      generateNextCode: jest.fn().mockResolvedValue('A1'),
      findByTrackingToken: jest.fn().mockResolvedValue(null),
    };
    const useCase = new CreateStorefrontOrderUseCase(
      orderRepo as any,
      { createBulk: jest.fn().mockResolvedValue([]) } as any,
      { findBySlug: jest.fn().mockResolvedValue(restaurant) } as any,
      {
        findByRestaurantId: jest
          .fn()
          .mockResolvedValue(
            makeHours([{ dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' }]),
          ),
      } as any,
      {
        findById: jest.fn().mockResolvedValue(makeMenuItem(optionGroups)),
      } as any,
      { findByItemId: jest.fn().mockResolvedValue(variants) } as any,
      { findByItemId: jest.fn().mockResolvedValue(availableOptions) } as any,
      { findByCode: jest.fn() } as any,
      { emitToRestaurant: jest.fn() } as any,
      { sendToRestaurant: jest.fn().mockResolvedValue(undefined) } as any,
    );
    return { useCase };
  }

  function inputWith(selectedOptionIds: string[]) {
    return {
      items: [{ menuItemId: 'm1', quantity: 1, selectedOptionIds, notes: '' }],
      customerName: 'Juan',
      customerPhone: '5491100000000',
      deliveryType: DeliveryType.PICKUP,
      paymentMethod: 'cash',
      notes: '',
    };
  }

  it('rechaza cuando se supera el máximo del grupo', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));
    try {
      const { useCase } = build([
        {
          name: 'Clasicos',
          minSelections: 0,
          maxSelections: 1,
          variantId: null,
          displayOrder: 0,
        },
      ]);
      const result = await useCase.execute('mi-resto', inputWith(['o1', 'o2']));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('MENU_ITEM_OPTION_LIMIT');
    } finally {
      jest.useRealTimers();
    }
  });

  it('rechaza cuando no se alcanza el mínimo del grupo', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));
    try {
      const { useCase } = build([
        {
          name: 'Clasicos',
          minSelections: 2,
          maxSelections: 4,
          variantId: null,
          displayOrder: 0,
        },
      ]);
      const result = await useCase.execute('mi-resto', inputWith(['o1']));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('MENU_ITEM_OPTION_LIMIT');
    } finally {
      jest.useRealTimers();
    }
  });

  it('permite una selección dentro del máximo', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));
    try {
      const { useCase } = build([
        {
          name: 'Clasicos',
          minSelections: 0,
          maxSelections: 4,
          variantId: null,
          displayOrder: 0,
        },
      ]);
      const result = await useCase.execute('mi-resto', inputWith(['o1', 'o2']));
      expect(result.ok).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
  describe('validación de identidad, disponibilidad y tamaño', () => {
    beforeEach(() =>
      jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z')),
    );
    afterEach(() => jest.useRealTimers());

    it.each([['inexistente'], ['o1', 'o1']])(
      'rechaza IDs inexistentes o repetidos: %j',
      async (...ids) => {
        const { useCase } = build([]);
        const result = await useCase.execute('mi-resto', inputWith(ids));
        expect(result.ok).toBe(false);
        if (!result.ok)
          expect(result.error.code).toBe('MENU_ITEM_OPTION_LIMIT');
      },
    );

    it.each([
      { ...(options.o1 as object), isAvailable: false },
      { ...(options.o1 as object), itemId: 'otro' },
      { ...(options.o1 as object), variantId: 'otro-tamano' },
    ])('rechaza una opción incompatible: %j', async (option) => {
      const { useCase } = build([], [], [option]);
      expect((await useCase.execute('mi-resto', inputWith(['o1']))).ok).toBe(
        false,
      );
    });

    it('aplica la regla específica y no exige otros tamaños ni grupos borrados', async () => {
      const { useCase } = build(
        [
          {
            name: 'Clasicos',
            minSelections: 2,
            maxSelections: 2,
            variantId: null,
            displayOrder: 0,
          },
          {
            name: 'Clasicos',
            minSelections: 1,
            maxSelections: 1,
            variantId: 'v1',
            displayOrder: 0,
          },
          {
            name: 'Clasicos',
            minSelections: 3,
            maxSelections: 3,
            variantId: 'v2',
            displayOrder: 0,
          },
          {
            name: 'Borrado',
            minSelections: 1,
            maxSelections: 1,
            variantId: null,
            displayOrder: 1,
          },
        ],
        [
          { id: 'v1', itemId: 'm1', maxSelections: 1 },
          { id: 'v2', itemId: 'm1', maxSelections: 4 },
        ],
      );
      const input = inputWith(['o1']);
      const result = await useCase.execute('mi-resto', {
        ...input,
        items: [{ ...input.items[0], variantId: 'v1' }],
      });
      expect(result.ok).toBe(true);
    });

    it('conserva el límite histórico total entre grupos y exige un tamaño válido', async () => {
      const variants = [
        { id: 'v1', itemId: 'm1', maxSelections: 1, priceOverride: null },
      ];
      const { useCase } = build([], variants, [
        options.o1,
        { ...(options.o2 as object), optionGroup: 'Premium' },
      ]);
      const input = inputWith(['o1', 'o2']);
      expect((await useCase.execute('mi-resto', input)).ok).toBe(false);
      expect(
        (
          await useCase.execute('mi-resto', {
            ...input,
            items: [{ ...input.items[0], variantId: 'v1' }],
          })
        ).ok,
      ).toBe(false);
    });
  });
});
