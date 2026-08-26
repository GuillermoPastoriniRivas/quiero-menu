import { SearchRestaurantsUseCase } from './search-restaurants.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';

describe('SearchRestaurantsUseCase', () => {
  const owner = new User(
    'u1',
    'juan@local.com',
    'hash',
    'Juan',
    true,
    new Date('2026-01-01'),
  );
  const restaurant = new Restaurant(
    'r1',
    'la-famosa',
    'La Famosa',
    '',
    '',
    '',
    '',
    'Concepción del Uruguay',
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
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );

  function buildUseCase(
    overrides: {
      restaurantRepo?: Partial<RestaurantRepository>;
      userRepo?: Partial<UserRepository>;
      userRestaurantRepo?: Partial<UserRestaurantRepository>;
      subscriptionRepo?: Partial<SubscriptionRepository>;
    } = {},
  ) {
    const restaurantRepo: RestaurantRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(restaurant),
      findBySlug: jest.fn(),
      searchAdmin: jest.fn().mockResolvedValue([restaurant]),
      findByStatus: jest.fn().mockResolvedValue([]),
      findByCustomDomain: jest.fn().mockResolvedValue(null),
      listByCustomDomainState: jest.fn().mockResolvedValue([]),
      listStaleCustomDomainProvisioning: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      delete: jest.fn(),
      ...overrides.restaurantRepo,
    };
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(owner),
      findByEmail: jest.fn(),
      searchByEmail: jest.fn().mockResolvedValue([]),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn(),
      delete: jest.fn(),
      ...overrides.userRepo,
    };
    const userRestaurantRepo: UserRestaurantRepository = {
      create: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      findByRestaurantId: jest
        .fn()
        .mockResolvedValue([
          new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER),
        ]),
      findByUserIdAndRestaurantId: jest.fn(),
      delete: jest.fn(),
      ...overrides.userRestaurantRepo,
    };
    const subscriptionRepo: SubscriptionRepository = {
      findByRestaurantId: jest.fn().mockResolvedValue(null),
      findByExternalSubscriptionId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteManyByRestaurantId: jest.fn(),
      ...overrides.subscriptionRepo,
    };
    return new SearchRestaurantsUseCase(
      restaurantRepo,
      userRepo,
      userRestaurantRepo,
      subscriptionRepo,
    );
  }

  it('devuelve locales con owner y plan', async () => {
    const useCase = buildUseCase({
      subscriptionRepo: {
        findByRestaurantId: jest.fn().mockResolvedValue({ plan: 'free' }),
      },
    });

    const results = await useCase.execute('famosa');

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: 'r1',
      slug: 'la-famosa',
      name: 'La Famosa',
      city: 'Concepción del Uruguay',
      status: 'active',
      plan: 'free',
      createdAt: new Date('2026-01-01'),
      ownerName: 'Juan',
      ownerEmail: 'juan@local.com',
    });
  });

  it('incluye locales encontrados por email del dueño aunque no matcheen nombre/slug', async () => {
    const useCase = buildUseCase({
      restaurantRepo: {
        // El slug "otro-resto" no matchea el termino de busqueda por email.
        searchAdmin: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(restaurant),
      },
      userRepo: {
        searchByEmail: jest.fn().mockResolvedValue([owner]),
      },
      userRestaurantRepo: {
        findByUserId: jest
          .fn()
          .mockResolvedValue([
            new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER),
          ]),
        findByRestaurantId: jest
          .fn()
          .mockResolvedValue([
            new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER),
          ]),
      },
    });

    const results = await useCase.execute('juan@local.com');

    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('la-famosa');
  });

  it('con termino vacio lista los ultimos locales sin buscar usuarios', async () => {
    const searchByEmail = jest.fn();
    const useCase = buildUseCase({ userRepo: { searchByEmail } });

    const results = await useCase.execute('');

    expect(results).toHaveLength(1);
    expect(searchByEmail).not.toHaveBeenCalled();
  });
});
