import { BackfillDirectoryDataUseCase } from './backfill-directory-data.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { MenuItemType } from '../../../domain/enums/menu-item-type.enum.js';
import { RestaurantCategory } from '../../../domain/enums/restaurant-category.enum.js';
import type { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import type { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';

function makeRestaurant(
  id: string,
  city: string,
  citySlug?: string,
  category?: RestaurantCategory,
) {
  return new Restaurant(
    id,
    `local-${id}`,
    `Local ${id}`,
    '',
    '',
    '',
    '',
    city,
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
    category,
    citySlug,
  );
}

function makeItem(restaurantId: string, name: string, isVisible = true) {
  return new MenuItem(
    `item-${restaurantId}-${name}`,
    restaurantId,
    'cat-1',
    name,
    '',
    1,
    '',
    0,
    true,
    isVisible,
    MenuItemType.SIMPLE,
  );
}

function makeDeps(restaurants: Restaurant[], items: MenuItem[]) {
  const updates: { id: string; data: Record<string, string> }[] = [];
  const restaurantRepo = {
    findByStatus: jest.fn().mockResolvedValue(restaurants),
    update: jest.fn(async (id: string, data: Record<string, string>) => {
      updates.push({ id, data });
      return null;
    }),
  } as unknown as RestaurantRepository;
  const itemRepo = {
    findByRestaurantIds: jest.fn().mockResolvedValue(items),
  } as unknown as MenuItemRepository;
  return { restaurantRepo, itemRepo, updates };
}

describe('BackfillDirectoryDataUseCase', () => {
  it('deriva citySlug de la ciudad existente e infiere categoria de los platos', async () => {
    const r1 = makeRestaurant('1', 'Concepción del Uruguay');
    const r2 = makeRestaurant('2', 'Paysandu');
    const { restaurantRepo, itemRepo, updates } = makeDeps(
      [r1, r2],
      [makeItem('1', 'Pizza muzzarella'), makeItem('2', 'Hamburguesa completa')],
    );
    const useCase = new BackfillDirectoryDataUseCase(restaurantRepo, itemRepo);

    const out = await useCase.execute();

    expect(out.citySlugFixed).toBe(2);
    expect(out.categoryInferred).toBe(2);
    expect(updates).toContainEqual({
      id: '1',
      data: { citySlug: 'concepcion-del-uruguay' },
    });
    expect(updates).toContainEqual({ id: '1', data: { category: 'pizzeria' } });
    expect(updates).toContainEqual({ id: '2', data: { citySlug: 'paysandu' } });
    expect(updates).toContainEqual({
      id: '2',
      data: { category: 'hamburgueseria' },
    });
  });

  it('es idempotente: no pisa datos que ya existen', async () => {
    const r = makeRestaurant(
      '1',
      'Concepción del Uruguay',
      'concepcion-del-uruguay',
      RestaurantCategory.CAFE,
    );
    const { restaurantRepo, itemRepo, updates } = makeDeps([r], [
      makeItem('1', 'Pizza'),
    ]);
    const useCase = new BackfillDirectoryDataUseCase(restaurantRepo, itemRepo);

    const out = await useCase.execute();

    expect(out.citySlugFixed).toBe(0);
    expect(out.categoryInferred).toBe(0);
    expect(updates).toHaveLength(0);
  });

  it('sin señal fuerte de platos deja la categoria vacia', async () => {
    const r = makeRestaurant('1', 'Concepción del Uruguay');
    const { restaurantRepo, itemRepo } = makeDeps([r], [
      makeItem('1', 'Ravioles con estofado'),
      makeItem('1', 'Tarta oculta', false),
    ]);
    const useCase = new BackfillDirectoryDataUseCase(restaurantRepo, itemRepo);

    const out = await useCase.execute();

    expect(out.citySlugFixed).toBe(1);
    expect(out.categoryInferred).toBe(0);
  });

  it('no inventa ciudad: sin city no escribe citySlug', async () => {
    const r = makeRestaurant('1', '');
    const { restaurantRepo, itemRepo, updates } = makeDeps([r], []);
    const useCase = new BackfillDirectoryDataUseCase(restaurantRepo, itemRepo);

    const out = await useCase.execute();

    expect(out.citySlugFixed).toBe(0);
    expect(updates).toHaveLength(0);
  });
});
