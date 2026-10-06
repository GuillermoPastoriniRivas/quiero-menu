import { SetRestaurantPlanUseCase } from './set-restaurant-plan.use-case.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { Subscription } from '../../../domain/entities/subscription.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';

describe('SetRestaurantPlanUseCase', () => {
  const restaurantId = 'r1';
  const freeSubscription = new Subscription(
    's1',
    restaurantId,
    PlanTier.FREE,
    SubscriptionStatus.ACTIVE,
    new Date('2026-01-01'),
    null,
    null,
    PaymentProvider.NONE,
    null,
    null,
    new Date('2026-01-01'),
    new Date('2026-01-01'),
  );
  const restaurant = new Restaurant(
    restaurantId,
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
      subscriptionRepo?: Partial<SubscriptionRepository>;
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
    const subscriptionRepo: SubscriptionRepository = {
      findByRestaurantId: jest.fn().mockResolvedValue(freeSubscription),
      findByExternalSubscriptionId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteManyByRestaurantId: jest.fn(),
      ...overrides.subscriptionRepo,
    };
    return {
      useCase: new SetRestaurantPlanUseCase(restaurantRepo, subscriptionRepo),
      subscriptionRepo,
    };
  }

  it('regala Pro dejando la suscripción activa sin vencimiento ni proveedor', async () => {
    const update = jest
      .fn()
      .mockResolvedValue(
        new Subscription(
          's1',
          restaurantId,
          PlanTier.PRO,
          SubscriptionStatus.ACTIVE,
          new Date('2026-01-01'),
          null,
          null,
          PaymentProvider.NONE,
          null,
          null,
          new Date('2026-01-01'),
          new Date('2026-01-01'),
        ),
      );
    const { useCase } = buildUseCase({ subscriptionRepo: { update } });

    const result = await useCase.execute({ restaurantId, plan: PlanTier.PRO });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      plan: PlanTier.PRO,
      status: SubscriptionStatus.ACTIVE,
    });
    expect(update).toHaveBeenCalledWith('s1', {
      plan: PlanTier.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: null,
      canceledAt: null,
      paymentProvider: PaymentProvider.NONE,
    });
  });

  it('quita Pro volviendo a Free sin tocar el proveedor', async () => {
    const update = jest
      .fn()
      .mockResolvedValue(
        new Subscription(
          's1',
          restaurantId,
          PlanTier.FREE,
          SubscriptionStatus.ACTIVE,
          new Date('2026-01-01'),
          null,
          null,
          PaymentProvider.MERCADO_PAGO,
          null,
          'ext_1',
          new Date('2026-01-01'),
          new Date('2026-01-01'),
        ),
      );
    const { useCase } = buildUseCase({ subscriptionRepo: { update } });

    const result = await useCase.execute({ restaurantId, plan: PlanTier.FREE });

    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith('s1', {
      plan: PlanTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: null,
      canceledAt: null,
    });
  });

  it('crea la suscripción si el local todavía no tiene', async () => {
    const create = jest.fn().mockResolvedValue({
      ...freeSubscription,
      plan: PlanTier.PRO,
    });
    const { useCase } = buildUseCase({
      subscriptionRepo: {
        findByRestaurantId: jest.fn().mockResolvedValue(null),
        create,
      },
    });

    const result = await useCase.execute({ restaurantId, plan: PlanTier.PRO });

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId,
        plan: PlanTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
        paymentProvider: PaymentProvider.NONE,
      }),
    );
  });

  it('falla si el local no existe', async () => {
    const update = jest.fn();
    const { useCase } = buildUseCase({
      restaurantRepo: { findById: jest.fn().mockResolvedValue(null) },
      subscriptionRepo: { update },
    });

    const result = await useCase.execute({ restaurantId, plan: PlanTier.PRO });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
