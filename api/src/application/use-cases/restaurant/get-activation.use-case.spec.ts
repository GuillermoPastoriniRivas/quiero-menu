import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import {
  GetActivationUseCase,
  MarkRestaurantSharedUseCase,
} from './get-activation.use-case.js';
import { UpdateRestaurantUseCase } from './update-restaurant.use-case.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

function restaurant(
  overrides: { sharedAt?: Date; phone?: string } = {},
): Restaurant {
  return new Restaurant(
    'r1',
    'la-famosa',
    'La Famosa',
    '',
    'https://cdn/logo.webp',
    '',
    '',
    'Concepción del Uruguay',
    'AR',
    null,
    overrides.phone ?? '3442 55-1234',
    'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#E8532C' },
    new Date('2026-09-01'),
    new Date('2026-09-01'),
    undefined,
    'concepcion-del-uruguay',
    'Entre Ríos',
    'argentina',
    'entre-rios',
    true,
    [],
    overrides.sharedAt ? { sharedAt: overrides.sharedAt } : undefined,
  );
}

describe('GetActivationUseCase', () => {
  function build(r: Restaurant | null) {
    const restaurantRepo: any = { findById: jest.fn().mockResolvedValue(r) };
    const menuItemRepo: any = {
      findByRestaurantId: jest
        .fn()
        .mockResolvedValue([
          { isVisible: true },
          { isVisible: false },
          { isVisible: true },
        ]),
    };
    const hoursRepo: any = {
      findByRestaurantId: jest.fn().mockResolvedValue([
        { dayOfWeek: 1, isClosed: false, opensAt: '19:00', closesAt: '23:00' },
        { dayOfWeek: 2, isClosed: true, opensAt: '', closesAt: '' },
      ]),
    };
    const orderRepo: any = {
      countByRestaurantIdSince: jest.fn().mockResolvedValue(0),
    };
    return new GetActivationUseCase(
      restaurantRepo,
      menuItemRepo,
      hoursRepo,
      orderRepo,
    );
  }

  it('evalúa los pasos del dueño con los datos reales del local', async () => {
    const out = await build(restaurant()).execute('r1');
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.value.checks).toEqual({
      menu: true,
      whatsapp: true,
      hours: true,
      look: false,
      location: false,
      payments: false,
      shared: false,
      firstOrder: false,
    });
    expect(out.value.summary).toEqual(
      expect.objectContaining({ done: 3, total: 8, next: 'look' }),
    );
    expect(out.value.details).toEqual({
      menuItems: 2,
      openDays: 1,
      orders: 0,
      whatsapp: '5493442551234',
      transferMissingAccount: true,
      sharedAt: null,
    });
  });

  it('404 si el local no existe', async () => {
    const out = await build(null).execute('r1');
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(RestaurantNotFoundError);
  });
});

describe('MarkRestaurantSharedUseCase', () => {
  it('guarda la primera vez y no pisa la fecha después', async () => {
    const first = new Date('2026-09-20T10:00:00Z');
    const restaurantRepo: any = {
      findById: jest.fn().mockResolvedValue(restaurant()),
      update: jest.fn(),
    };
    const uc = new MarkRestaurantSharedUseCase(restaurantRepo);
    await uc.execute('r1', first);
    expect(restaurantRepo.update).toHaveBeenCalledWith('r1', {
      activation: { sharedAt: first },
    });

    restaurantRepo.findById.mockResolvedValue(restaurant({ sharedAt: first }));
    restaurantRepo.update.mockClear();
    const again = await uc.execute('r1', new Date('2026-09-22'));
    expect(again).toEqual({ ok: true, value: { sharedAt: first } });
    expect(restaurantRepo.update).not.toHaveBeenCalled();
  });
});

describe('UpdateRestaurantUseCase', () => {
  function build() {
    const restaurantRepo: any = {
      findBySlug: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(restaurant()),
      update: jest.fn((_id: string, data: unknown) =>
        Promise.resolve({ id: 'r1', data }),
      ),
    };
    return {
      repo: restaurantRepo,
      uc: new UpdateRestaurantUseCase(restaurantRepo),
    };
  }

  it('al cambiar la ciudad deriva región y país del mapa conocido', async () => {
    const { repo, uc } = build();
    await uc.execute('r1', { city: 'Paraná' });
    expect(repo.update).toHaveBeenCalledWith('r1', {
      city: 'Paraná',
      citySlug: 'parana',
      region: 'Entre Ríos',
      regionSlug: 'entre-rios',
      countrySlug: 'argentina',
    });
  });

  it('una ciudad desconocida limpia la región vieja en vez de dejarla mal', async () => {
    const { repo, uc } = build();
    await uc.execute('r1', { city: 'Pueblo Nuevo' });
    expect(repo.update).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({
        citySlug: 'pueblo-nuevo',
        region: '',
        regionSlug: '',
      }),
    );
  });

  it('respeta la región explícita del admin', async () => {
    const { repo, uc } = build();
    await uc.execute('r1', { city: 'Pueblo Nuevo', region: 'Córdoba' });
    expect(repo.update).toHaveBeenCalledWith('r1', {
      city: 'Pueblo Nuevo',
      citySlug: 'pueblo-nuevo',
      region: 'Córdoba',
      regionSlug: 'cordoba',
    });
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('sin campos geo no toca nada extra', async () => {
    const { repo, uc } = build();
    await uc.execute('r1', { name: 'Otro nombre' });
    expect(repo.update).toHaveBeenCalledWith('r1', { name: 'Otro nombre' });
  });
});
