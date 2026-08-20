import { UpdateOpenStatusUseCase } from './update-open-status.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';

function makeRestaurant(
  openOverride: 'open' | 'closed' | null = null,
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
    'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    openOverride,
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

describe('UpdateOpenStatusUseCase', () => {
  // Jueves 11:00 ART, abierto de 09:00 a 22:00
  jest.useFakeTimers().setSystemTime(new Date('2026-08-20T14:00:00.000Z'));

  function buildUseCase(restaurant: Restaurant, hours: OperatingHours[]) {
    const restaurantRepo = {
      findById: jest.fn().mockResolvedValue(restaurant),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest
        .fn()
        .mockImplementation((id: string, data: unknown) =>
          Promise.resolve({ ...restaurant, ...(data as object) }),
        ),
      delete: jest.fn(),
    };
    const hoursRepo = {
      findByRestaurantId: jest.fn().mockResolvedValue(hours),
      upsertBulk: jest.fn(),
      deleteByRestaurantId: jest.fn(),
    };
    const gateway = { emitToRestaurant: jest.fn() };
    const useCase = new UpdateOpenStatusUseCase(
      restaurantRepo as any,
      hoursRepo as any,
      gateway as any,
    );
    return { useCase, restaurantRepo, gateway };
  }

  const openHours = makeHours([
    { dayOfWeek: 4, opensAt: '09:00', closesAt: '22:00' },
  ]);

  it('horario abierto + pedir abierto => queda en auto (null)', async () => {
    const { useCase, restaurantRepo, gateway } = buildUseCase(
      makeRestaurant(null),
      openHours,
    );
    const result = await useCase.execute('r1', true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.openOverride).toBeNull();
    }
    expect(restaurantRepo.update).toHaveBeenCalledWith('r1', {
      openOverride: null,
    });
    expect(gateway.emitToRestaurant).toHaveBeenCalledWith(
      'r1',
      'restaurant.updated',
      expect.any(Object),
    );
  });

  it('horario cerrado + pedir abierto => override open (manual)', async () => {
    const closedHours = makeHours([
      { dayOfWeek: 0, opensAt: '10:00', closesAt: '18:00' },
    ]);
    const { useCase, restaurantRepo } = buildUseCase(
      makeRestaurant(null),
      closedHours,
    );
    const result = await useCase.execute('r1', true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.openOverride).toBe('open');
    }
    expect(restaurantRepo.update).toHaveBeenCalledWith('r1', {
      openOverride: 'open',
    });
  });

  it('horario abierto + pedir cerrado => override closed (manual)', async () => {
    const { useCase, restaurantRepo } = buildUseCase(
      makeRestaurant(null),
      openHours,
    );
    const result = await useCase.execute('r1', false);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.openOverride).toBe('closed');
    }
    expect(restaurantRepo.update).toHaveBeenCalledWith('r1', {
      openOverride: 'closed',
    });
  });

  it('error si no existe el restaurante', async () => {
    const restaurantRepo = {
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };
    const hoursRepo = { findByRestaurantId: jest.fn() };
    const gateway = { emitToRestaurant: jest.fn() };
    const useCase = new UpdateOpenStatusUseCase(
      restaurantRepo as any,
      hoursRepo as any,
      gateway as any,
    );
    const result = await useCase.execute('r1', true);
    expect(result.ok).toBe(false);
  });
});
