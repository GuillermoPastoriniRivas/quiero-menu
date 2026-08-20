import { createHash } from 'crypto';
import { LoginUseCase } from './login.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';

describe('LoginUseCase', () => {
  const user = new User(
    'u1',
    'owner@test.com',
    'hash',
    'Owner',
    true,
    new Date('2026-01-01'),
  );
  const ur = new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER);
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
    'America/Bogota',
    'COP',
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
      userRepo?: Partial<UserRepository>;
      userRestaurantRepo?: Partial<UserRestaurantRepository>;
      refreshTokenRepo?: Partial<RefreshTokenRepository>;
      restaurantRepo?: Partial<RestaurantRepository>;
      passwordHasher?: Partial<PasswordHasherPort>;
      tokenProvider?: Partial<TokenProviderPort>;
    } = {},
  ) {
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(user),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn(),
      delete: jest.fn(),
    };
    const userRestaurantRepo: UserRestaurantRepository = {
      create: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([ur]),
      findByRestaurantId: jest.fn(),
      findByUserIdAndRestaurantId: jest.fn(),
      delete: jest.fn(),
    };
    const refreshTokenRepo: RefreshTokenRepository = {
      create: jest.fn().mockResolvedValue({} as never),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
    };
    const restaurantRepo: RestaurantRepository = {
      create: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn().mockResolvedValue(restaurant),
      findByCustomDomain: jest.fn().mockResolvedValue(null),
      listByCustomDomainState: jest.fn().mockResolvedValue([]),
      listStaleCustomDomainProvisioning: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const passwordHasher: PasswordHasherPort = {
      hash: jest.fn(),
      verify: jest.fn().mockResolvedValue(true),
    };
    const tokenProvider: TokenProviderPort = {
      signAccess: jest.fn().mockReturnValue('access-token'),
      signRefresh: jest.fn().mockReturnValue('refresh-token'),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
    };

    Object.assign(userRepo, overrides.userRepo);
    Object.assign(userRestaurantRepo, overrides.userRestaurantRepo);
    Object.assign(refreshTokenRepo, overrides.refreshTokenRepo);
    Object.assign(restaurantRepo, overrides.restaurantRepo);
    Object.assign(passwordHasher, overrides.passwordHasher);
    Object.assign(tokenProvider, overrides.tokenProvider);

    const useCase = new LoginUseCase(
      userRepo,
      userRestaurantRepo,
      refreshTokenRepo,
      restaurantRepo,
      passwordHasher,
      tokenProvider,
    );

    return {
      useCase,
      userRepo,
      userRestaurantRepo,
      refreshTokenRepo,
      restaurantRepo,
      passwordHasher,
      tokenProvider,
    };
  }

  it('loggea con credenciales válidas y guarda el refresh token hasheado', async () => {
    const { useCase, refreshTokenRepo, passwordHasher, tokenProvider } =
      buildUseCase();

    const result = await useCase.execute({
      email: 'owner@test.com',
      password: 'secret123',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(passwordHasher.verify).toHaveBeenCalledWith('secret123', 'hash');
    expect(tokenProvider.signAccess).toHaveBeenCalledWith({
      sub: 'u1',
      restaurantId: 'r1',
      role: UserRole.OWNER,
    });
    expect(refreshTokenRepo.create).toHaveBeenCalledWith({
      userId: 'u1',
      tokenHash: createHash('sha256').update('refresh-token').digest('hex'),
      expiresAt: expect.any(Date),
    });
    expect(result.value.accessToken).toBe('access-token');
    expect(result.value.user.restaurantSlug).toBe('mi-resto');
  });

  it('rechaza cuando el email no existe', async () => {
    const { useCase, userRepo } = buildUseCase({
      userRepo: { findByEmail: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute({
      email: 'nadie@test.com',
      password: 'secret123',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
    expect(userRepo.findByEmail).toHaveBeenCalledWith('nadie@test.com');
  });

  it('rechaza cuando la contraseña no coincide', async () => {
    const { useCase } = buildUseCase({
      passwordHasher: { verify: jest.fn().mockResolvedValue(false) },
    });

    const result = await useCase.execute({
      email: 'owner@test.com',
      password: 'wrong',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('rechaza cuando el usuario no tiene restaurantes asociados', async () => {
    const { useCase, userRestaurantRepo } = buildUseCase({
      userRestaurantRepo: { findByUserId: jest.fn().mockResolvedValue([]) },
    });

    const result = await useCase.execute({
      email: 'owner@test.com',
      password: 'secret123',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
    expect(userRestaurantRepo.findByUserId).toHaveBeenCalledWith('u1');
  });

  it('soporta restaurante sin slug (no rompe el login)', async () => {
    const { useCase } = buildUseCase({
      restaurantRepo: { findById: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute({
      email: 'owner@test.com',
      password: 'secret123',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.user.restaurantSlug).toBe('');
  });
});
