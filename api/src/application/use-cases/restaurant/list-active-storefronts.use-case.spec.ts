import { ListActiveStorefrontsUseCase } from './list-active-storefronts.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { MenuItemType } from '../../../domain/enums/menu-item-type.enum.js';
import type { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import type { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import type { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import type { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';

function makeRestaurant(id: string, overrides: Partial<Restaurant> = {}) {
  return new Restaurant(
    id,
    overrides.slug ?? `local-${id}`,
    overrides.name ?? `Local ${id}`,
    '',
    '',
    '',
    '',
    overrides.city ?? 'Concepción del Uruguay',
    'AR',
    null,
    '+5490000000000',
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
    overrides.category,
    overrides.citySlug ?? 'concepcion-del-uruguay',
    undefined,
    undefined,
    undefined,
    overrides.claimed,
    undefined,
    undefined,
    overrides.isDemo,
  );
}

function makeItem(restaurantId: string, categoryId: string, name: string) {
  return new MenuItem(
    `item-${restaurantId}-${name}`,
    restaurantId,
    categoryId,
    name,
    '',
    8500,
    '',
    0,
    true,
    true,
    MenuItemType.SIMPLE,
  );
}

function makeUseCase(
  restaurants: Restaurant[],
  categories: { id: string; restaurantId: string; isVisible: boolean }[],
  items: MenuItem[],
) {
  const restaurantRepo = {
    findByStatus: jest.fn().mockResolvedValue(restaurants),
  } as unknown as RestaurantRepository;
  const categoryRepo = {
    findByRestaurantIds: jest.fn().mockResolvedValue(
      categories.map((c) => ({
        ...c,
        name: 'Carta',
        description: '',
        displayOrder: 0,
      })),
    ),
  } as unknown as MenuCategoryRepository;
  const itemRepo = {
    findByRestaurantIds: jest.fn().mockResolvedValue(items),
  } as unknown as MenuItemRepository;
  const hoursRepo = {
    findByRestaurantIds: jest.fn().mockResolvedValue([]),
  } as unknown as OperatingHoursRepository;
  return new ListActiveStorefrontsUseCase(
    restaurantRepo,
    categoryRepo,
    itemRepo,
    hoursRepo,
  );
}

describe('ListActiveStorefrontsUseCase', () => {
  it('excluye los locales demo aunque tengan carta o sean inventario', async () => {
    const realConCarta = makeRestaurant('1', { name: 'Real con carta' });
    const realInventario = makeRestaurant('2', {
      name: 'Real inventario',
      claimed: false,
    });
    const demoConCarta = makeRestaurant('3', {
      name: 'Demo con carta',
      isDemo: true,
    });
    const demoInventario = makeRestaurant('4', {
      name: 'Demo ficha',
      claimed: false,
      isDemo: true,
    });

    const useCase = makeUseCase(
      [realConCarta, realInventario, demoConCarta, demoInventario],
      [
        { id: 'cat-1', restaurantId: '1', isVisible: true },
        { id: 'cat-3', restaurantId: '3', isVisible: true },
      ],
      [makeItem('1', 'cat-1', 'Pizza'), makeItem('3', 'cat-3', 'Pizza')],
    );

    const out = await useCase.execute();

    expect(out.map((r) => r.slug).sort()).toEqual(['local-1', 'local-2']);
  });
});
