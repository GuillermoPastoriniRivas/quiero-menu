import { SetCustomDomainUseCase } from './set-custom-domain.use-case.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import {
  CustomDomainInvalidError,
  CustomDomainAlreadyInUseError,
  CustomDomainRequiresProError,
} from '../../../domain/errors/domain-errors.js';

function makeRestaurant(): Restaurant {
  return new Restaurant(
    'r1',
    'mi-resto',
    'Mi Resto',
    '',
    '',
    '',
    '',
    '',
    'AR',
    null,
    '+5491100000000',
    'America/Argentina/Buenos_Aires',
    'ARS',
    RestaurantStatus.ACTIVE,
    null,
    null,
    null,
    null,
    { cashEnabled: true, cardEnabled: true, transferEnabled: true },
    { primaryColor: '#000000' },
    new Date(),
    new Date(),
  );
}

function buildUseCase(
  overrides: {
    restaurantRepo?: any;
    subscriptionRepo?: any;
  } = {},
) {
  const restaurantRepo = {
    findById: jest.fn().mockResolvedValue(makeRestaurant()),
    findByCustomDomain: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(makeRestaurant()),
    findBySlug: jest.fn(),
    create: jest.fn(),
    listByCustomDomainState: jest.fn(),
    delete: jest.fn(),
    ...(overrides.restaurantRepo ?? {}),
  };
  const subscriptionRepo = {
    findByRestaurantId: jest.fn().mockResolvedValue({
      plan: PlanTier.PRO,
      status: SubscriptionStatus.ACTIVE,
    }),
    ...(overrides.subscriptionRepo ?? {}),
  };
  const useCase = new SetCustomDomainUseCase(restaurantRepo, subscriptionRepo, [
    'quiero.menu',
    'www.quiero.menu',
  ]);
  return { useCase, restaurantRepo, subscriptionRepo };
}

describe('SetCustomDomainUseCase', () => {
  it('asigna el dominio y deja el estado en pending cuando es Pro', async () => {
    const { useCase, restaurantRepo } = buildUseCase();
    const result = await useCase.execute('r1', 'menu.mirestaurante.com');

    expect(result.ok).toBe(true);
    expect(restaurantRepo.update).toHaveBeenCalledWith('r1', {
      customDomain: 'menu.mirestaurante.com',
      customDomainStatus: {
        state: 'pending',
        requestedAt: expect.any(Date),
      },
    });
  });

  it('normaliza el dominio (lowercase, sin scheme ni path)', async () => {
    const { useCase, restaurantRepo } = buildUseCase();
    await useCase.execute('r1', 'HTTPS://MiResto.com/menu');

    expect(restaurantRepo.update).toHaveBeenCalledWith('r1', {
      customDomain: 'miresto.com',
      customDomainStatus: {
        state: 'pending',
        requestedAt: expect.any(Date),
      },
    });
  });

  it('rechaza con CustomDomainRequiresProError si no es Pro activo', async () => {
    const { useCase } = buildUseCase({
      subscriptionRepo: {
        findByRestaurantId: jest.fn().mockResolvedValue({
          plan: PlanTier.FREE,
          status: SubscriptionStatus.ACTIVE,
        }),
      },
    });
    const result = await useCase.execute('r1', 'menu.mirestaurante.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CustomDomainRequiresProError);
    }
  });

  it('rechaza dominios propios de quiero.menu', async () => {
    const { useCase } = buildUseCase();
    for (const domain of ['quiero.menu', 'www.quiero.menu', 'x.quiero.menu']) {
      const result = await useCase.execute('r1', domain);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(CustomDomainInvalidError);
      }
    }
  });

  it('rechaza un dominio con formato inválido', async () => {
    const { useCase } = buildUseCase();
    for (const domain of ['no-es-un-dominio', '..dominio..', 'a b.com']) {
      const result = await useCase.execute('r1', domain);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(CustomDomainInvalidError);
      }
    }
  });

  it('rechaza un dominio ya asignado a otro local', async () => {
    const { useCase } = buildUseCase({
      restaurantRepo: {
        findByCustomDomain: jest.fn().mockResolvedValue({ id: 'r2' }),
      },
    });
    const result = await useCase.execute('r1', 'menu.mirestaurante.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(CustomDomainAlreadyInUseError);
    }
  });
});
