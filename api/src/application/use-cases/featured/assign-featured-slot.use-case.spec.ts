import {
  AssignFeaturedSlotUseCase,
  MAX_CATEGORY_SLOTS,
} from './assign-featured-slot.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { RestaurantCategory } from '../../../domain/enums/restaurant-category.enum.js';
import {
  RestaurantNotFoundError,
  FeaturedSlotFullError,
} from '../../../domain/errors/domain-errors.js';

function makeRestaurant() {
  return new Restaurant(
    'r1',
    'la-famosa',
    'La Famosa',
    '',
    '',
    '',
    '',
    'Paysandu',
    'AR',
    null,
    '',
    'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#E8532C' },
    new Date(),
    new Date(),
    RestaurantCategory.PIZZERIA,
    'paysandu',
    true,
  );
}

function deps(opts: { restaurant: Restaurant | null; used: number }) {
  const restaurantRepo: any = {
    findById: jest.fn().mockResolvedValue(opts.restaurant),
  };
  const slotRepo: any = {
    countActiveScope: jest.fn().mockResolvedValue(opts.used),
    create: jest.fn((d: any) =>
      Promise.resolve({ id: 's1', endsAt: d.endsAt }),
    ),
  };
  const uc = new AssignFeaturedSlotUseCase(restaurantRepo, slotRepo);
  return { uc, restaurantRepo, slotRepo };
}

describe('AssignFeaturedSlotUseCase', () => {
  it('404 si el local no existe', async () => {
    const { uc } = deps({ restaurant: null, used: 0 });
    const out = await uc.execute({
      restaurantId: 'nope',
      scope: 'category',
      days: 30,
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(RestaurantNotFoundError);
  });

  it('rechaza cuando el cupo está lleno', async () => {
    const { uc, slotRepo } = deps({
      restaurant: makeRestaurant(),
      used: MAX_CATEGORY_SLOTS,
    });
    const out = await uc.execute({
      restaurantId: 'r1',
      scope: 'category',
      days: 30,
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toBeInstanceOf(FeaturedSlotFullError);
    expect(slotRepo.create).not.toHaveBeenCalled();
  });

  it('asigna con ciudad y rubro del local y vencimiento por días', async () => {
    const { uc, slotRepo } = deps({ restaurant: makeRestaurant(), used: 2 });
    const out = await uc.execute({
      restaurantId: 'r1',
      scope: 'category',
      days: 30,
    });
    expect(out.ok).toBe(true);
    expect(slotRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: 'r1',
        scope: 'category',
        citySlug: 'paysandu',
        category: 'pizzeria',
      }),
    );
    if (out.ok) {
      const days =
        (out.value.endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      expect(days).toBeGreaterThan(29);
      expect(days).toBeLessThanOrEqual(30);
    }
  });
});
