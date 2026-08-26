import { CreateRestaurantAccountUseCase } from './create-restaurant-account.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { EmailServicePort } from '../../ports/email-service.port.js';

describe('CreateRestaurantAccountUseCase', () => {
  const baseInput = {
    ownerName: 'Juan Perez',
    email: 'local@test.com',
    password: 'secreto-seguro',
    restaurantName: 'La Famosa',
    restaurantSlug: 'la-famosa-cde',
    city: 'Concepción del Uruguay',
  };

  function buildUseCase(
    overrides: {
      userRepo?: Partial<UserRepository>;
      restaurantRepo?: Partial<RestaurantRepository>;
      userRestaurantRepo?: Partial<UserRestaurantRepository>;
      passwordHasher?: Partial<PasswordHasherPort>;
      subscriptionRepo?: Partial<SubscriptionRepository>;
      verificationTokenRepo?: Partial<VerificationTokenRepository>;
      emailService?: Partial<EmailServicePort>;
    } = {},
  ) {
    const createdUser = {
      id: 'u-new',
      name: baseInput.ownerName,
      email: baseInput.email,
      emailVerified: false,
    };
    const userRepo: UserRepository = {
      create: jest.fn().mockResolvedValue(createdUser),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      searchByEmail: jest.fn().mockResolvedValue([]),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn(),
      delete: jest.fn(),
      ...overrides.userRepo,
    };
    const restaurantRepo: RestaurantRepository = {
      create: jest.fn().mockImplementation((data) => ({
        id: 'r-new',
        ...data,
      })),
      findById: jest.fn(),
      findBySlug: jest.fn().mockResolvedValue(null),
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
      create: jest.fn().mockResolvedValue({}),
      findByUserId: jest.fn().mockResolvedValue([]),
      findByRestaurantId: jest.fn().mockResolvedValue([]),
      findByUserIdAndRestaurantId: jest.fn(),
      delete: jest.fn(),
      ...overrides.userRestaurantRepo,
    };
    const passwordHasher: PasswordHasherPort = {
      hash: jest.fn().mockResolvedValue('hashed'),
      verify: jest.fn(),
      ...overrides.passwordHasher,
    };
    const subscriptionRepo: SubscriptionRepository = {
      findByRestaurantId: jest.fn(),
      findByExternalSubscriptionId: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn(),
      deleteManyByRestaurantId: jest.fn(),
      ...overrides.subscriptionRepo,
    };
    const verificationTokenRepo: VerificationTokenRepository = {
      create: jest.fn().mockResolvedValue({}),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
      ...overrides.verificationTokenRepo,
    };
    const emailService: EmailServicePort = {
      send: jest.fn().mockResolvedValue(undefined),
      ...overrides.emailService,
    };
    return new CreateRestaurantAccountUseCase(
      userRepo,
      restaurantRepo,
      userRestaurantRepo,
      passwordHasher,
      subscriptionRepo,
      verificationTokenRepo,
      emailService,
      'http://localhost:3003',
    );
  }

  it('crea usuario OWNER + restaurante FREE con ciudad y moneda ARS por defecto', async () => {
    const useCase = buildUseCase();
    const subCreate = (useCase as any).subscriptionRepo.create as jest.Mock;
    const restCreate = (useCase as any).restaurantRepo.create as jest.Mock;

    const result = await useCase.execute(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      userId: 'u-new',
      restaurantId: 'r-new',
      slug: baseInput.restaurantSlug,
    });
    expect(restCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Concepción del Uruguay',
        currency: 'ARS',
        country: 'AR',
      }),
    );
    expect(subCreate).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'free', status: 'active' }),
    );
  });

  it('rechaza email ya registrado', async () => {
    const useCase = buildUseCase({
      userRepo: {
        findByEmail: jest
          .fn()
          .mockResolvedValue({ id: 'exists', email: baseInput.email }),
      },
    });

    const result = await useCase.execute(baseInput);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('rechaza slug ocupado sin crear nada', async () => {
    const useCase = buildUseCase({
      restaurantRepo: {
        findBySlug: jest.fn().mockResolvedValue({ id: 'taken' }),
      },
    });
    const userCreate = (useCase as any).userRepo.create as jest.Mock;

    const result = await useCase.execute(baseInput);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('SLUG_ALREADY_EXISTS');
    expect(userCreate).not.toHaveBeenCalled();
  });

  it('puede omitir los emails del dueño', async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const useCase = buildUseCase({ emailService: { send } });

    await useCase.execute({ ...baseInput, sendOwnerEmails: false });

    expect(send).not.toHaveBeenCalled();
  });
});
