import { createHash } from 'crypto';
import { RefreshTokenUseCase } from './refresh-token.use-case.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';

describe('RefreshTokenUseCase', () => {
  function buildUseCase(
    overrides: {
      refreshTokenRepo?: Partial<RefreshTokenRepository>;
      userRepo?: Partial<UserRepository>;
      userRestaurantRepo?: Partial<UserRestaurantRepository>;
      tokenProvider?: Partial<TokenProviderPort>;
    } = {},
  ) {
    const storedToken = new RefreshToken(
      'rt1',
      'u1',
      'hash-existente',
      new Date(Date.now() + 86400000),
      new Date(),
    );
    const refreshTokenRepo: RefreshTokenRepository = {
      create: jest.fn().mockResolvedValue({} as never),
      findByTokenHash: jest.fn().mockResolvedValue(storedToken),
      delete: jest.fn().mockResolvedValue(true),
      deleteAllByUserId: jest.fn(),
    };
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest
        .fn()
        .mockResolvedValue(
          new User('u1', 'owner@test.com', 'hash', 'Owner', true, new Date()),
        ),
      findByEmail: jest.fn(),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn(),
      delete: jest.fn(),
    };
    const userRestaurantRepo: UserRestaurantRepository = {
      create: jest.fn(),
      findByUserId: jest
        .fn()
        .mockResolvedValue([
          new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER),
        ]),
      findByRestaurantId: jest.fn(),
      findByUserIdAndRestaurantId: jest.fn(),
      delete: jest.fn(),
    };
    const tokenProvider: TokenProviderPort = {
      signAccess: jest.fn().mockReturnValue('nuevo-access'),
      signRefresh: jest.fn().mockReturnValue('nuevo-refresh'),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
    };

    Object.assign(refreshTokenRepo, overrides.refreshTokenRepo);
    Object.assign(userRepo, overrides.userRepo);
    Object.assign(userRestaurantRepo, overrides.userRestaurantRepo);
    Object.assign(tokenProvider, overrides.tokenProvider);

    const useCase = new RefreshTokenUseCase(
      refreshTokenRepo,
      userRepo,
      userRestaurantRepo,
      tokenProvider,
    );
    return {
      useCase,
      refreshTokenRepo,
      userRepo,
      userRestaurantRepo,
      tokenProvider,
    };
  }

  it('rota el token: crea el nuevo, borra el viejo', async () => {
    const { useCase, refreshTokenRepo, tokenProvider } = buildUseCase();

    const result = await useCase.execute('refresh-token');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.accessToken).toBe('nuevo-access');
    expect(result.value.refreshToken).toBe('nuevo-refresh');
    expect(refreshTokenRepo.create).toHaveBeenCalledWith({
      userId: 'u1',
      tokenHash: createHash('sha256').update('nuevo-refresh').digest('hex'),
      expiresAt: expect.any(Date),
    });
    expect(refreshTokenRepo.delete).toHaveBeenCalledWith('rt1');
    expect(tokenProvider.signAccess).toHaveBeenCalledWith({
      sub: 'u1',
      restaurantId: 'r1',
      role: UserRole.OWNER,
    });
  });

  it('rechaza token inexistente', async () => {
    const { useCase } = buildUseCase({
      refreshTokenRepo: { findByTokenHash: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute('refresh-token');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('rechaza token expirado', async () => {
    const expired = new RefreshToken(
      'rt1',
      'u1',
      'hash',
      new Date(Date.now() - 1000),
      new Date(),
    );
    const { useCase } = buildUseCase({
      refreshTokenRepo: {
        findByTokenHash: jest.fn().mockResolvedValue(expired),
      },
    });

    const result = await useCase.execute('refresh-token');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('rechaza cuando el usuario no existe o no tiene restaurante', async () => {
    const { useCase } = buildUseCase({
      userRepo: { findById: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute('refresh-token');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });
});
