import { SearchStorefrontsUseCase } from './search-storefronts.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { MenuItemType } from '../../../domain/enums/menu-item-type.enum.js';
import type { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import type { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import type { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import type { SearchTermRepository } from '../../../domain/repositories/search-term.repository.js';

function makeRestaurant(id: string, overrides: Partial<Restaurant> = {}) {
  return new Restaurant(
    id,
    overrides.slug ?? `local-${id}`,
    overrides.name ?? `Local ${id}`,
    overrides.description ?? '',
    '',
    '',
    overrides.address ?? '',
    overrides.city ?? 'Concepción del Uruguay',
    'AR',
    null,
    '+5490000000000',
    overrides.timezone ?? 'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    overrides.openOverride ?? null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#E8532C' },
    new Date(),
    new Date(),
    overrides.category,
    overrides.citySlug ?? 'concepcion-del-uruguay',
  );
}

function makeItem(
  restaurantId: string,
  name: string,
  opts: { isAvailable?: boolean; isVisible?: boolean } = {},
) {
  return new MenuItem(
    `item-${restaurantId}-${name}`,
    restaurantId,
    'cat-1',
    name,
    '',
    8500,
    '',
    0,
    opts.isAvailable ?? true,
    opts.isVisible ?? true,
    MenuItemType.SIMPLE,
  );
}

function makeRepoDeps(
  restaurants: Restaurant[],
  items: MenuItem[],
  hours: OperatingHours[],
) {
  const restaurantRepo: RestaurantRepository = {
    findByStatus: jest.fn().mockResolvedValue(restaurants),
  } as unknown as RestaurantRepository;
  const itemRepo: MenuItemRepository = {
    findByRestaurantIds: jest.fn().mockResolvedValue(items),
  } as unknown as MenuItemRepository;
  const hoursRepo: OperatingHoursRepository = {
    findByRestaurantIds: jest.fn().mockResolvedValue(hours),
  } as unknown as OperatingHoursRepository;
  const searchTermRepo: SearchTermRepository = {
    record: jest.fn().mockResolvedValue(undefined),
    listTop: jest.fn().mockResolvedValue([]),
  };
  return { restaurantRepo, itemRepo, hoursRepo, searchTermRepo };
}

function makeUseCase(deps: ReturnType<typeof makeRepoDeps>) {
  return new SearchStorefrontsUseCase(
    deps.restaurantRepo,
    deps.itemRepo,
    deps.hoursRepo,
    deps.searchTermRepo,
  );
}

describe('SearchStorefrontsUseCase', () => {
  it('encuentra locales por plato de su carta, insensible a acentos', async () => {
    const parrilla = makeRestaurant('1', { name: "Leonardo's" });
    const cafe = makeRestaurant('2', { name: 'Café Central' });
    const deps = makeRepoDeps(
      [parrilla, cafe],
      [
        makeItem('1', 'Milanesa napolitana'),
        makeItem('1', 'Ravioles'),
        makeItem('2', 'Medialunas'),
      ],
      [],
    );
    const useCase = makeUseCase(deps);

    const out = await useCase.execute({ q: 'milanesa napolitana' });

    expect(out.total).toBe(1);
    expect(out.results[0].slug).toBe('local-1');
    expect(out.results[0].matchedItems).toHaveLength(1);
    expect(out.results[0].matchedItems[0].name).toBe('Milanesa napolitana');
  });

  it('rankea nombre del local por encima de coincidencia por plato', async () => {
    const leonardos = makeRestaurant('1', { name: 'La Milanesa' });
    const otro = makeRestaurant('2', { name: 'El Rincón' });
    const deps = makeRepoDeps(
      [leonardos, otro],
      [makeItem('1', 'Ñoquis'), makeItem('2', 'Milanesa con papas')],
      [],
    );
    const useCase = makeUseCase(deps);

    const out = await useCase.execute({ q: 'milanesa' });

    expect(out.total).toBe(2);
    expect(out.results[0].slug).toBe('local-1');
    expect(out.results[0].matchedItems).toHaveLength(0);
    expect(out.results[1].matchedItems).toHaveLength(1);
  });

  it('filtra por openNow y citySlug', async () => {
    const abierto = makeRestaurant('1', { openOverride: 'open' });
    const cerrado = makeRestaurant('2', { openOverride: 'closed' });
    const otraCiudad = makeRestaurant('3', {
      openOverride: 'open',
      city: 'Gualeguaychú',
      citySlug: 'gualeguaychu',
    });
    const deps = makeRepoDeps(
      [abierto, cerrado, otraCiudad],
      [makeItem('1', 'Pizza'), makeItem('2', 'Pizza'), makeItem('3', 'Pizza')],
      [],
    );
    const useCase = makeUseCase(deps);

    const openOut = await useCase.execute({ openNow: true });
    expect(openOut.results.map((r) => r.slug).sort()).toEqual([
      'local-1',
      'local-3',
    ]);

    const cityOut = await useCase.execute({
      citySlug: 'concepcion-del-uruguay',
      q: 'pizza',
    });
    expect(cityOut.total).toBe(2);
  });

  it('excluye items no visibles y locales sin coincidencia', async () => {
    const local = makeRestaurant('1', { name: 'La Rotisería' });
    const deps = makeRepoDeps(
      [local],
      [makeItem('1', 'Tarta de jamón', { isVisible: false })],
      [],
    );
    const useCase = makeUseCase(deps);

    const out = await useCase.execute({ q: 'tarta' });
    expect(out.total).toBe(0);

    const all = await useCase.execute({});
    expect(all.total).toBe(1);
  });

  it('matchea el rubro de la taxonomia', async () => {
    const pizzeria = makeRestaurant('1', { category: 'pizzeria' as never });
    const deps = makeRepoDeps([pizzeria], [makeItem('1', 'Faina')], []);
    const useCase = makeUseCase(deps);

    const out = await useCase.execute({ q: 'pizza' });
    expect(out.total).toBe(1);
  });

  it('loguea el termino buscado y marca los sin resultados', async () => {
    const local = makeRestaurant('1', { name: 'La Rotisería' });
    const deps = makeRepoDeps([local], [makeItem('1', 'Milanesa')], []);
    const useCase = makeUseCase(deps);

    await useCase.execute({ q: 'Milanesa' });
    expect(deps.searchTermRepo.record).toHaveBeenCalledWith('milanesa', true);

    await useCase.execute({ q: 'tartiflette' });
    expect(deps.searchTermRepo.record).toHaveBeenCalledWith(
      'tartiflette',
      false,
    );

    await useCase.execute({});
    expect(deps.searchTermRepo.record).toHaveBeenCalledTimes(2);
  });
});
