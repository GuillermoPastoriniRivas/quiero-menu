import { createHash } from 'crypto';
import { ImpersonateRestaurantOwnerUseCase } from './impersonate-restaurant-owner.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';

describe('ImpersonateRestaurantOwnerUseCase', () => {
  const owner = new User(
    'u1',
    'owner@test.com',
    'hash',
    'Owner',
    true,
    new Date('2026-01-01'),
  );
  const ownerLink = new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER);
  const kitchenLink = new UserRestaurant('ur2', 'u2', 'r1', UserRole.KITCHEN);
  const restaurant = new Restaurant(
    'r1',
    'mi-resto',
    'Mi Resto',
    '',
    '',
    '',
    '',
    '',
    '',
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
      userRestaurantRepo?: Partial<UserRestaurantRepository>;
      userRepo?: Partial<UserRepository>;
      refreshTokenRepo?: Partial<RefreshTokenRepository>;
      tokenProvider?: Partial<TokenProviderPort>;
    } = {},
  ) {
    const restaurantRepo: RestaurantRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(restaurant),
      findBySlug: jest.fn(),
      searchAdmin: jest.fn().mockResolvedValue([]),
      findByStatus: jest.fn().mockResolvedValue([]),
      findByCustomDomain: jest.fn().mockResolvedValue(null),
      listByCustomDomainState: jest.fn().mockResolvedValue([]),
      listStaleCustomDomainProvisioning: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      delete: jest.fn(),
      ...overrides.restaurantRepo,
    };
    const userRestaurantRepo: UserRestaurantRepository = {
      create: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      findByRestaurantId: jest.fn().mockResolvedValue([kitchenLink, ownerLink]),
      findByUserIdAndRestaurantId: jest.fn(),
      delete: jest.fn(),
      ...overrides.userRestaurantRepo,
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
    const refreshTokenRepo: RefreshTokenRepository = {
      create: jest.fn().mockResolvedValue(undefined),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
      ...overrides.refreshTokenRepo,
    };
    const tokenProvider: TokenProviderPort = {
      signAccess: jest.fn().mockReturnValue('access-token'),
      signRefresh: jest.fn().mockReturnValue('refresh-token'),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
      ...overrides.tokenProvider,
    };
    return new ImpersonateRestaurantOwnerUseCase(
      restaurantRepo,
      userRestaurantRepo,
      userRepo,
      refreshTokenRepo,
      tokenProvider,
    );
  }

  it('emite sesion del OWNER con claim imp y sin plat', async () => {
    let capturedPayload: Record<string, unknown> | undefined;
    const useCase = buildUseCase({
      tokenProvider: {
        signAccess: jest.fn((payload) => {
          capturedPayload = { ...(payload as object) } as Record<
            string,
            unknown
          >;
          return 'access-token';
        }),
      },
    });

    const result = await useCase.execute('r1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.accessToken).toBe('access-token');
    expect(result.value.impersonated).toBe(true);
    expect(result.value.user).toEqual({
      id: 'u1',
      name: 'Owner',
      email: 'owner@test.com',
      role: UserRole.OWNER,
      restaurantId: 'r1',
      restaurantSlug: 'mi-resto',
    });
    expect(capturedPayload).toMatchObject({
      sub: 'u1',
      restaurantId: 'r1',
      role: UserRole.OWNER,
      imp: true,
    });
    expect(capturedPayload?.plat).toBeUndefined();
  });

  it('persiste el refresh token hasheado para el owner', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const signRefresh = jest.fn().mockReturnValue('raw-refresh');
    const useCase = buildUseCase({
      refreshTokenRepo: { create },
      tokenProvider: { signRefresh },
    });

    await useCase.execute('r1');

    expect(create).toHaveBeenCalledWith({
      userId: 'u1',
      tokenHash: createHash('sha256').update('raw-refresh').digest('hex'),
      expiresAt: expect.any(Date),
    });
  });

  it('falla si el restaurante no existe', async () => {
    const useCase = buildUseCase({
      restaurantRepo: { findById: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute('nope');

    expect(result.ok).toBe(false);
  });
});
