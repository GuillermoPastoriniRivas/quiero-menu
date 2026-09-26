import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import type {
  InsightDemand,
  InsightInvitation,
  InsightOwner,
  InsightSubscription,
  RestaurantInsightsQuery,
} from '../../ports/restaurant-insights.port.js';
import { AdminRestaurantIndex, stageOf } from './admin-restaurant-index.js';
import { ListAdminRestaurantsUseCase } from './list-admin-restaurants.use-case.js';
import { GetAdminOverviewUseCase } from './get-admin-overview.use-case.js';
import { collapseEntries } from './admin-activity.js';

const NOW = new Date('2026-09-24T12:00:00Z');
const DAY = 86_400_000;

interface Fixture {
  id: string;
  name: string;
  createdDaysAgo: number;
  claimed?: boolean;
  status?: RestaurantStatus;
  phone?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  coordinates?: { lat: number; lng: number } | null;
  citySlug?: string;
  owner?: InsightOwner;
  subscription?: InsightSubscription;
  invitation?: InsightInvitation;
  items?: number;
  openDays?: number;
  demand?: Partial<InsightDemand>;
  orders30d?: number;
}

function restaurant(f: Fixture): Restaurant {
  return new Restaurant(
    f.id,
    f.id,
    f.name,
    '',
    f.logoUrl ?? '',
    f.bannerUrl ?? '',
    f.address ?? '',
    'Concepción del Uruguay',
    'AR',
    f.coordinates ?? null,
    f.phone ?? '',
    'America/Argentina/Buenos_Aires',
    'ARS',
    f.status ?? RestaurantStatus.ACTIVE,
    null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: false, transferEnabled: false },
    { primaryColor: '#E8532C' },
    new Date(NOW.getTime() - f.createdDaysAgo * DAY),
    NOW,
    undefined,
    f.citySlug ?? 'concepcion-del-uruguay',
    'Entre Ríos',
    'argentina',
    'entre-rios',
    f.claimed,
    [],
  );
}

function fakeInsights(fixtures: Fixture[]): RestaurantInsightsQuery {
  const byId = new Map(fixtures.map((f) => [f.id, f]));
  const pick = <T>(ids: string[], get: (f: Fixture) => T | undefined) => {
    const out = new Map<string, T>();
    for (const id of ids) {
      const value = get(byId.get(id)!);
      if (value !== undefined) out.set(id, value);
    }
    return Promise.resolve(out);
  };
  return {
    findRestaurants: jest.fn((filter) => {
      const term = filter.term?.toLowerCase() ?? '';
      const found = fixtures
        .filter(
          (f) =>
            !filter.citySlug ||
            (f.citySlug ?? 'concepcion-del-uruguay') === filter.citySlug,
        )
        .filter(
          (f) =>
            !term ||
            f.name.toLowerCase().includes(term) ||
            (filter.ownerMatchIds ?? []).includes(f.id),
        )
        .map(restaurant);
      return Promise.resolve(found);
    }),
    restaurantIdsByOwnerEmail: jest.fn((term: string) =>
      Promise.resolve(
        fixtures.filter((f) => f.owner?.email.includes(term)).map((f) => f.id),
      ),
    ),
    owners: jest.fn((ids: string[]) => pick(ids, (f) => f.owner)),
    subscriptions: jest.fn((ids: string[]) => pick(ids, (f) => f.subscription)),
    openInvitations: jest.fn((ids: string[]) => pick(ids, (f) => f.invitation)),
    menuItemCounts: jest.fn((ids: string[]) => pick(ids, (f) => f.items)),
    openDayCounts: jest.fn((ids: string[]) => pick(ids, (f) => f.openDays)),
    demand: jest.fn((ids: string[]) =>
      pick(ids, (f) =>
        f.demand
          ? { views: 0, whatsapp: 0, maps: 0, instagram: 0, ...f.demand }
          : undefined,
      ),
    ),
    orderCounts: jest.fn((ids: string[]) => pick(ids, (f) => f.orders30d)),
    platformOrders: jest.fn((since: Date) =>
      Promise.resolve(
        since.getTime() >= NOW.getTime() - 7 * DAY - 1000
          ? { orders: 9, restaurants: 2 }
          : { orders: 4, restaurants: 1 },
      ),
    ),
    pendingClaimsCount: jest.fn(() => Promise.resolve(3)),
    cities: jest.fn(() =>
      Promise.resolve([
        {
          citySlug: 'concepcion-del-uruguay',
          city: 'Concepción del Uruguay',
          count: fixtures.length,
        },
      ]),
    ),
    timeline: jest.fn(() => Promise.resolve([])),
    users: jest.fn(() => Promise.resolve(new Map())),
    restaurantLabels: jest.fn(() => Promise.resolve(new Map())),
  };
}

const owner = (email: string): InsightOwner => ({
  userId: `u-${email}`,
  name: email,
  email,
});

const complete: Partial<Fixture> = {
  phone: '343 412-3456',
  logoUrl: 'https://cdn/logo.webp',
  bannerUrl: 'https://cdn/banner.webp',
  address: 'San Martín 123',
  coordinates: { lat: -32.48, lng: -58.23 },
  items: 20,
  openDays: 6,
};

const FIXTURES: Fixture[] = [
  {
    id: 'ficha-lista',
    name: 'Lista',
    createdDaysAgo: 5,
    claimed: false,
    ...complete,
    demand: { views: 40, whatsapp: 3 },
  },
  { id: 'ficha-vacia', name: 'Vacía', createdDaysAgo: 1, claimed: false },
  {
    id: 'invitada',
    name: 'Invitada',
    createdDaysAgo: 10,
    claimed: false,
    ...complete,
    invitation: {
      id: 'i1',
      email: null,
      expiresAt: new Date(NOW.getTime() + 2 * DAY),
      createdAt: NOW,
    },
    demand: { views: 5 },
  },
  {
    id: 'activo',
    name: 'Activo',
    createdDaysAgo: 20,
    owner: owner('duenio@local.com'),
    subscription: { plan: 'free', status: 'active' },
    items: 4,
  },
  {
    id: 'pro',
    name: 'Pro',
    createdDaysAgo: 30,
    owner: owner('pro@local.com'),
    subscription: { plan: 'pro', status: 'active' },
    ...complete,
    orders30d: 12,
  },
  {
    id: 'pausado',
    name: 'Pausado',
    createdDaysAgo: 40,
    status: RestaurantStatus.PAUSED,
    owner: owner('p@local.com'),
  },
  { id: 'huerfano', name: 'Huérfano', createdDaysAgo: 50, claimed: true },
];

describe('stageOf', () => {
  it('prioriza pausado, después dueño, invitación y plan', () => {
    const active = { status: RestaurantStatus.ACTIVE };
    expect(
      stageOf(
        { status: RestaurantStatus.SUSPENDED },
        owner('a@b.c'),
        null,
        null,
      ),
    ).toBe('pausado');
    expect(stageOf(active, null, null, null)).toBe('ficha');
    expect(
      stageOf(active, null, null, {
        id: 'i',
        email: null,
        expiresAt: NOW,
        createdAt: NOW,
      }),
    ).toBe('invitado');
    expect(
      stageOf(active, owner('a@b.c'), { plan: 'free', status: 'active' }, null),
    ).toBe('activo');
    expect(
      stageOf(active, owner('a@b.c'), { plan: 'pro', status: 'active' }, null),
    ).toBe('pro');
    expect(
      stageOf(
        active,
        owner('a@b.c'),
        { plan: 'pro', status: 'canceled' },
        null,
      ),
    ).toBe('activo');
  });
});

describe('ListAdminRestaurantsUseCase', () => {
  function build() {
    const insights = fakeInsights(FIXTURES);
    const index = new AdminRestaurantIndex(insights);
    return new ListAdminRestaurantsUseCase(index, insights);
  }

  it('cuenta etapas sobre todo el inventario y filtra por etapa', async () => {
    const out = await build().execute({ stage: 'ficha' });
    expect(out.stages).toEqual({
      ficha: 3,
      invitado: 1,
      activo: 1,
      pro: 1,
      pausado: 1,
      all: 7,
    });
    expect(out.items.map((i) => i.id).sort()).toEqual([
      'ficha-lista',
      'ficha-vacia',
      'huerfano',
    ]);
  });

  it('marca los locales que toman pedidos sin dueño', async () => {
    const out = await build().execute({});
    const byId = new Map(out.items.map((i) => [i.id, i]));
    expect(byId.get('huerfano')!.ordersWithoutOwner).toBe(true);
    expect(byId.get('ficha-vacia')!.ordersWithoutOwner).toBe(false);
    expect(byId.get('activo')!.ordersWithoutOwner).toBe(false);
  });

  it('calcula completitud de ficha y la usa para ordenar', async () => {
    const out = await build().execute({ sort: 'readiness' });
    expect(out.items[0].listing.percent).toBe(100);
    const vacia = out.items.find((i) => i.id === 'ficha-vacia')!;
    expect(vacia.listing).toEqual(
      expect.objectContaining({ done: 0, total: 5, next: 'menu' }),
    );
  });

  it('ordena por demanda con los clicks de WhatsApp pesando más que las visitas', async () => {
    const out = await build().execute({ sort: 'demand' });
    expect(out.items[0].id).toBe('ficha-lista');
    expect(out.items[1].id).toBe('invitada');
  });

  it('busca por email del dueño', async () => {
    const out = await build().execute({ q: 'duenio@' });
    expect(out.items.map((i) => i.id)).toEqual(['activo']);
  });

  it('pagina', async () => {
    const out = await build().execute({ limit: 3, page: 3, sort: 'name' });
    expect(out.total).toBe(7);
    expect(out.pages).toBe(3);
    expect(out.page).toBe(3);
    expect(out.items).toHaveLength(1);
  });
});

describe('GetAdminOverviewUseCase', () => {
  it('arma el embudo y las listas de trabajo', async () => {
    const insights = fakeInsights(FIXTURES);
    const uc = new GetAdminOverviewUseCase(
      new AdminRestaurantIndex(insights),
      insights,
    );
    const out = await uc.execute(NOW);
    expect(out.pipeline.all).toBe(7);
    expect(out.pendingClaims).toBe(3);
    expect(out.platform).toEqual({
      ordersLast7d: 9,
      ordersPrev7d: 4,
      activeRestaurants7d: 2,
    });
    expect(out.lists.readyToInvite.map((i) => i.id)).toEqual(['ficha-lista']);
    expect(out.lists.expiringInvitations.map((i) => i.id)).toEqual([
      'invitada',
    ]);
    expect(out.lists.hotLeads.map((i) => i.id)).toEqual([
      'ficha-lista',
      'invitada',
    ]);
    expect(out.lists.stalledOwners.map((i) => i.id)).toEqual(['activo']);
    expect(out.lists.ordersWithoutOwner.map((i) => i.id)).toEqual(['huerfano']);
    expect(out.inventory).toEqual({
      withMenu: 4,
      listingReady: 3,
      ordersWithoutOwner: 1,
    });
  });
});

describe('collapseEntries', () => {
  it('agrupa escrituras seguidas del mismo actor sobre el mismo local', () => {
    const at = (min: number) => new Date(NOW.getTime() - min * 60_000);
    const entry = (
      id: string,
      event: string,
      min: number,
      restaurantId = 'r1',
    ) => ({
      id,
      event,
      actorUserId: 'admin',
      restaurantId,
      metadata: null,
      createdAt: at(min),
    });
    const out = collapseEntries([
      entry('1', 'admin.operate_write', 1),
      entry('2', 'admin.operate_write', 3),
      entry('3', 'admin.operate_write', 5),
      entry('4', 'admin.invitation_created', 6),
      entry('5', 'admin.operate_write', 7),
      entry('6', 'admin.operate_write', 120),
    ]);
    expect(out.map((e) => [e.id, e.count])).toEqual([
      ['1', 3],
      ['4', 1],
      ['5', 1],
      ['6', 1],
    ]);
  });
});
