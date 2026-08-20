import { createHash } from 'crypto';
import { SignupUseCase } from './signup.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { EmailServicePort } from '../../ports/email-service.port.js';
import { User } from '../../../domain/entities/user.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import {
  EmailAlreadyExistsError,
  SlugAlreadyExistsError,
} from '../../../domain/errors/domain-errors.js';

describe('SignupUseCase', () => {
  function buildUseCase(
    overrides: {
      userRepo?: Partial<UserRepository>;
      restaurantRepo?: Partial<RestaurantRepository>;
      userRestaurantRepo?: Partial<UserRestaurantRepository>;
      refreshTokenRepo?: Partial<RefreshTokenRepository>;
      subscriptionRepo?: Partial<SubscriptionRepository>;
      verificationTokenRepo?: Partial<VerificationTokenRepository>;
      passwordHasher?: Partial<PasswordHasherPort>;
      tokenProvider?: Partial<TokenProviderPort>;
      emailService?: Partial<EmailServicePort>;
    } = {},
  ) {
    const userRepo: UserRepository = {
      create: jest
        .fn()
        .mockResolvedValue(
          new User(
            'u1',
            'owner@test.com',
            'hashed',
            'Owner',
            false,
            new Date(),
          ),
        ),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn(),
      delete: jest.fn(),
    };
    const restaurantRepo: RestaurantRepository = {
      create: jest
        .fn()
        .mockResolvedValue(
          new Restaurant(
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
            new Date(),
            new Date(),
          ),
        ),
      findById: jest.fn(),
      findBySlug: jest.fn().mockResolvedValue(null),
      findByCustomDomain: jest.fn().mockResolvedValue(null),
      listByCustomDomainState: jest.fn().mockResolvedValue([]),
      listStaleCustomDomainProvisioning: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const userRestaurantRepo: UserRestaurantRepository = {
      create: jest
        .fn()
        .mockResolvedValue(
          new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER),
        ),
      findByUserId: jest
        .fn()
        .mockResolvedValue([
          new UserRestaurant('ur1', 'u1', 'r1', UserRole.OWNER),
        ]),
      findByRestaurantId: jest.fn(),
      findByUserIdAndRestaurantId: jest.fn(),
      delete: jest.fn(),
    };
    const refreshTokenRepo: RefreshTokenRepository = {
      create: jest
        .fn()
        .mockResolvedValue(
          new RefreshToken(
            'rt1',
            'u1',
            'hash',
            new Date(Date.now() + 86400000),
            new Date(),
          ),
        ),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
    };
    const subscriptionRepo: SubscriptionRepository = {
      create: jest.fn().mockResolvedValue({} as never),
      findByRestaurantId: jest.fn(),
      findByExternalSubscriptionId: jest.fn(),
      update: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const verificationTokenRepo: VerificationTokenRepository = {
      create: jest.fn().mockResolvedValue({} as never),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
    };
    const passwordHasher: PasswordHasherPort = {
      hash: jest.fn().mockResolvedValue('hashed'),
      verify: jest.fn(),
    };
    const tokenProvider: TokenProviderPort = {
      signAccess: jest.fn().mockReturnValue('access-token'),
      signRefresh: jest.fn().mockReturnValue('refresh-token'),
      verifyAccess: jest.fn(),
      verifyRefresh: jest.fn(),
    };
    const emailService: EmailServicePort = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    Object.assign(userRepo, overrides.userRepo);
    Object.assign(restaurantRepo, overrides.restaurantRepo);
    Object.assign(userRestaurantRepo, overrides.userRestaurantRepo);
    Object.assign(refreshTokenRepo, overrides.refreshTokenRepo);
    Object.assign(subscriptionRepo, overrides.subscriptionRepo);
    Object.assign(verificationTokenRepo, overrides.verificationTokenRepo);
    Object.assign(passwordHasher, overrides.passwordHasher);
    Object.assign(tokenProvider, overrides.tokenProvider);
    Object.assign(emailService, overrides.emailService);

    const useCase = new SignupUseCase(
      userRepo,
      restaurantRepo,
      userRestaurantRepo,
      refreshTokenRepo,
      passwordHasher,
      tokenProvider,
      subscriptionRepo,
      verificationTokenRepo,
      emailService,
      'https://quiero.menu',
    );

    return {
      useCase,
      userRepo,
      restaurantRepo,
      userRestaurantRepo,
      refreshTokenRepo,
      subscriptionRepo,
      verificationTokenRepo,
      passwordHasher,
      tokenProvider,
      emailService,
    };
  }

  const input = {
    name: 'Owner',
    email: 'owner@test.com',
    password: 'secret123',
    restaurantName: 'Mi Resto',
    restaurantSlug: 'mi-resto',
  };

  it('crea usuario, restaurante, membresía y suscripción free', async () => {
    const {
      useCase,
      userRepo,
      restaurantRepo,
      userRestaurantRepo,
      subscriptionRepo,
    } = buildUseCase();

    const result = await useCase.execute(input);

    expect(result.ok).toBe(true);
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'owner@test.com',
        emailVerified: false,
      }),
    );
    expect(restaurantRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'mi-resto',
        status: RestaurantStatus.ACTIVE,
      }),
    );
    expect(userRestaurantRepo.create).toHaveBeenCalledWith({
      userId: 'u1',
      restaurantId: 'r1',
      role: UserRole.OWNER,
    });
    expect(subscriptionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: 'r1',
        plan: PlanTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        paymentProvider: PaymentProvider.NONE,
      }),
    );
  });

  it('emite access + refresh token y persiste el refresh hasheado', async () => {
    const { useCase, refreshTokenRepo, tokenProvider } = buildUseCase();

    const result = await useCase.execute(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.accessToken).toBe('access-token');
    expect(result.value.refreshToken).toBe('refresh-token');
    expect(refreshTokenRepo.create).toHaveBeenCalledWith({
      userId: 'u1',
      tokenHash: createHash('sha256').update('refresh-token').digest('hex'),
      expiresAt: expect.any(Date),
    });
    expect(tokenProvider.signAccess).toHaveBeenCalledWith({
      sub: 'u1',
      restaurantId: 'r1',
      role: UserRole.OWNER,
    });
  });

  it('envía welcome y verify-email sin bloquear el signup', async () => {
    const { useCase, emailService, verificationTokenRepo } = buildUseCase();

    await useCase.execute(input);
    // Fire-and-forget: esperamos a que la promesa interna termine.
    await new Promise((r) => setTimeout(r, 0));

    expect(emailService.send).toHaveBeenCalledTimes(2);
    const subjects = (emailService.send as jest.Mock).mock.calls.map(
      (c) => c[0].subject,
    );
    expect(subjects[0]).toContain('Bienvenido');
    expect(subjects[1]).toContain('Verificá tu email');
    expect(verificationTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        type: 'email_verification',
      }),
    );
  });

  it('rechaza cuando el email ya existe', async () => {
    const { useCase } = buildUseCase({
      userRepo: {
        findByEmail: jest
          .fn()
          .mockResolvedValue(
            new User('u1', 'owner@test.com', 'h', 'Owner', false, new Date()),
          ),
      },
    });

    const result = await useCase.execute(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(EmailAlreadyExistsError);
  });

  it('rechaza cuando el slug ya existe', async () => {
    const { useCase } = buildUseCase({
      restaurantRepo: { findBySlug: jest.fn().mockResolvedValue({} as never) },
    });

    const result = await useCase.execute(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(SlugAlreadyExistsError);
  });
});
