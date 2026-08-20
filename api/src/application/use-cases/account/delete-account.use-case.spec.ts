import { DeleteAccountUseCase } from './delete-account.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { KitchenAccessTokenRepository } from '../../../domain/repositories/kitchen-access-token.repository.js';
import { DeliveryAccessTokenRepository } from '../../../domain/repositories/delivery-access-token.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { BillingRecordRepository } from '../../../domain/repositories/billing-record.repository.js';
import { PushSubscriptionRepository } from '../../../domain/repositories/push-subscription.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { PaymentProviderPort } from '../../ports/payment-provider.port.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';

describe('DeleteAccountUseCase', () => {
  function buildUseCase(
    overrides: {
      userRepo?: Partial<UserRepository>;
      userRestaurantRepo?: Partial<UserRestaurantRepository>;
      restaurantRepo?: Partial<RestaurantRepository>;
      categoryRepo?: Partial<MenuCategoryRepository>;
      itemRepo?: Partial<MenuItemRepository>;
      variantRepo?: Partial<MenuItemVariantRepository>;
      optionRepo?: Partial<MenuItemOptionRepository>;
      orderRepo?: Partial<OrderRepository>;
      orderItemRepo?: Partial<OrderItemRepository>;
      operatingHoursRepo?: Partial<OperatingHoursRepository>;
      deliveryZoneRepo?: Partial<DeliveryZoneRepository>;
      kitchenTokenRepo?: Partial<KitchenAccessTokenRepository>;
      deliveryTokenRepo?: Partial<DeliveryAccessTokenRepository>;
      subscriptionRepo?: Partial<SubscriptionRepository>;
      billingRecordRepo?: Partial<BillingRecordRepository>;
      pushSubRepo?: Partial<PushSubscriptionRepository>;
      refreshTokenRepo?: Partial<RefreshTokenRepository>;
      verificationTokenRepo?: Partial<VerificationTokenRepository>;
      passwordHasher?: Partial<PasswordHasherPort>;
      paymentProvider?: Partial<PaymentProviderPort>;
    } = {},
  ) {
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest
        .fn()
        .mockResolvedValue(
          new User('u1', 'owner@test.com', 'hash', 'Owner', false, new Date()),
        ),
      findByEmail: jest.fn(),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn(),
      delete: jest.fn().mockResolvedValue(true),
    };
    const userRestaurantRepo: UserRestaurantRepository = {
      create: jest.fn(),
      findByUserId: jest
        .fn()
        .mockResolvedValue([
          new UserRestaurant('ul1', 'u1', 'r1', UserRole.OWNER),
        ]),
      findByRestaurantId: jest.fn(),
      findByUserIdAndRestaurantId: jest.fn(),
      delete: jest.fn().mockResolvedValue(true),
    };
    const restaurantRepo: RestaurantRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue({ id: 'r1', slug: 'resto' }),
      findBySlug: jest.fn(),
      findByCustomDomain: jest.fn().mockResolvedValue(null),
      listByCustomDomainState: jest.fn().mockResolvedValue([]),
      listStaleCustomDomainProvisioning: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(true),
    };
    const categoryRepo: MenuCategoryRepository = {
      create: jest.fn(),
      findByRestaurantId: jest.fn().mockResolvedValue([{ id: 'c1' }]),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(true),
      reorder: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const itemRepo: MenuItemRepository = {
      create: jest.fn(),
      findByRestaurantId: jest.fn(),
      findByCategoryId: jest.fn().mockResolvedValue([{ id: 'i1' }]),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorder: jest.fn(),
      deleteByCategoryId: jest.fn().mockResolvedValue(undefined),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const variantRepo: MenuItemVariantRepository = {
      create: jest.fn(),
      findByItemId: jest.fn(),
      findByItemIds: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByItemId: jest.fn().mockResolvedValue(undefined),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const optionRepo: MenuItemOptionRepository = {
      create: jest.fn(),
      findByItemId: jest.fn(),
      findByItemIds: jest.fn(),
      findByVariantId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByItemId: jest.fn().mockResolvedValue(undefined),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const orderRepo: OrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByFilters: jest
        .fn()
        .mockResolvedValue({ data: [], meta: { total: 0, page: 1, pages: 0 } }),
      updateStatus: jest.fn(),
      updateReceiptUrl: jest.fn(),
      generateNextCode: jest.fn(),
      countByRestaurantIdSince: jest.fn(),
      findNthOrderCreatedAt: jest.fn(),
      listCustomers: jest.fn(),
      findOrdersByCustomer: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const orderItemRepo: OrderItemRepository = {
      createBulk: jest.fn(),
      findByOrderId: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const operatingHoursRepo: OperatingHoursRepository = {
      findByRestaurantId: jest.fn(),
      upsertBulk: jest.fn(),
      deleteByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const deliveryZoneRepo: DeliveryZoneRepository = {
      create: jest.fn(),
      findByRestaurantId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const kitchenTokenRepo: KitchenAccessTokenRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByToken: jest.fn(),
      findByRestaurantId: jest.fn(),
      revoke: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const deliveryTokenRepo: DeliveryAccessTokenRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByToken: jest.fn(),
      findByRestaurantId: jest.fn(),
      revoke: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const subscriptionRepo: SubscriptionRepository = {
      findByRestaurantId: jest.fn().mockResolvedValue({
        id: 's1',
        externalSubscriptionId: 'sub_ext_1',
      }),
      findByExternalSubscriptionId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const billingRecordRepo: BillingRecordRepository = {
      create: jest.fn(),
      findByRestaurantId: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
    };
    const pushSubRepo: PushSubscriptionRepository = {
      create: jest.fn(),
      findByEndpoint: jest.fn(),
      deleteByEndpoint: jest.fn(),
      findByRestaurantId: jest.fn(),
      findByOrderCode: jest.fn(),
      deleteManyByRestaurantId: jest.fn().mockResolvedValue(undefined),
      deleteManyByUserId: jest.fn().mockResolvedValue(undefined),
    };
    const refreshTokenRepo: RefreshTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
    };
    const verificationTokenRepo: VerificationTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
    };
    const passwordHasher: PasswordHasherPort = {
      hash: jest.fn(),
      verify: jest.fn().mockResolvedValue(true),
    };
    const paymentProvider: PaymentProviderPort = {
      createCheckout: jest.fn(),
      cancelSubscription: jest.fn().mockResolvedValue(undefined),
      getCustomerPortalUrl: jest.fn(),
      verifyWebhookSignature: jest.fn(),
      parseWebhookEvent: jest.fn(),
    };

    Object.assign(userRepo, overrides.userRepo);
    Object.assign(userRestaurantRepo, overrides.userRestaurantRepo);
    Object.assign(restaurantRepo, overrides.restaurantRepo);
    Object.assign(categoryRepo, overrides.categoryRepo);
    Object.assign(itemRepo, overrides.itemRepo);
    Object.assign(variantRepo, overrides.variantRepo);
    Object.assign(optionRepo, overrides.optionRepo);
    Object.assign(orderRepo, overrides.orderRepo);
    Object.assign(orderItemRepo, overrides.orderItemRepo);
    Object.assign(operatingHoursRepo, overrides.operatingHoursRepo);
    Object.assign(deliveryZoneRepo, overrides.deliveryZoneRepo);
    Object.assign(kitchenTokenRepo, overrides.kitchenTokenRepo);
    Object.assign(deliveryTokenRepo, overrides.deliveryTokenRepo);
    Object.assign(subscriptionRepo, overrides.subscriptionRepo);
    Object.assign(billingRecordRepo, overrides.billingRecordRepo);
    Object.assign(pushSubRepo, overrides.pushSubRepo);
    Object.assign(refreshTokenRepo, overrides.refreshTokenRepo);
    Object.assign(verificationTokenRepo, overrides.verificationTokenRepo);
    Object.assign(passwordHasher, overrides.passwordHasher);
    Object.assign(paymentProvider, overrides.paymentProvider);

    const useCase = new DeleteAccountUseCase(
      userRepo,
      userRestaurantRepo,
      restaurantRepo,
      categoryRepo,
      itemRepo,
      variantRepo,
      optionRepo,
      orderRepo,
      orderItemRepo,
      operatingHoursRepo,
      deliveryZoneRepo,
      kitchenTokenRepo,
      deliveryTokenRepo,
      subscriptionRepo,
      billingRecordRepo,
      pushSubRepo,
      refreshTokenRepo,
      verificationTokenRepo,
      passwordHasher,
      paymentProvider,
    );
    return {
      useCase,
      userRepo,
      userRestaurantRepo,
      restaurantRepo,
      categoryRepo,
      itemRepo,
      variantRepo,
      optionRepo,
      orderRepo,
      orderItemRepo,
      operatingHoursRepo,
      deliveryZoneRepo,
      kitchenTokenRepo,
      deliveryTokenRepo,
      subscriptionRepo,
      billingRecordRepo,
      pushSubRepo,
      refreshTokenRepo,
      verificationTokenRepo,
      passwordHasher,
      paymentProvider,
    };
  }

  it('borra en cascada cuenta, restaurante, menú, órdenes y tokens', async () => {
    const {
      useCase,
      userRepo,
      userRestaurantRepo,
      restaurantRepo,
      categoryRepo,
      itemRepo,
      variantRepo,
      optionRepo,
      orderRepo,
      orderItemRepo,
      operatingHoursRepo,
      deliveryZoneRepo,
      kitchenTokenRepo,
      deliveryTokenRepo,
      subscriptionRepo,
      billingRecordRepo,
      pushSubRepo,
      refreshTokenRepo,
      verificationTokenRepo,
    } = buildUseCase();

    const result = await useCase.execute('u1', 'password');

    expect(result.ok).toBe(true);
    expect(categoryRepo.delete).toHaveBeenCalledWith('c1');
    expect(itemRepo.deleteByCategoryId).toHaveBeenCalledWith('c1');
    expect(variantRepo.deleteByItemId).toHaveBeenCalledWith('i1');
    expect(optionRepo.deleteByItemId).toHaveBeenCalledWith('i1');
    expect(orderItemRepo.deleteManyByRestaurantId).toHaveBeenCalledWith('r1');
    expect(orderRepo.deleteManyByRestaurantId).toHaveBeenCalledWith('r1');
    expect(operatingHoursRepo.deleteByRestaurantId).toHaveBeenCalledWith('r1');
    expect(deliveryZoneRepo.deleteManyByRestaurantId).toHaveBeenCalledWith(
      'r1',
    );
    expect(kitchenTokenRepo.deleteManyByRestaurantId).toHaveBeenCalledWith(
      'r1',
    );
    expect(deliveryTokenRepo.deleteManyByRestaurantId).toHaveBeenCalledWith(
      'r1',
    );
    expect(subscriptionRepo.deleteManyByRestaurantId).toHaveBeenCalledWith(
      'r1',
    );
    expect(billingRecordRepo.deleteManyByRestaurantId).toHaveBeenCalledWith(
      'r1',
    );
    expect(pushSubRepo.deleteManyByRestaurantId).toHaveBeenCalledWith('r1');
    expect(pushSubRepo.deleteManyByUserId).toHaveBeenCalledWith('u1');
    expect(refreshTokenRepo.deleteAllByUserId).toHaveBeenCalledWith('u1');
    expect(verificationTokenRepo.deleteAllByUserId).toHaveBeenCalledWith(
      'u1',
      'email_verification',
    );
    expect(userRestaurantRepo.delete).toHaveBeenCalledWith('ul1');
    expect(restaurantRepo.delete).toHaveBeenCalledWith('r1');
    expect(userRepo.delete).toHaveBeenCalledWith('u1');
  });

  it('cancela la suscripción externa antes de borrar', async () => {
    const { useCase, paymentProvider, subscriptionRepo } = buildUseCase();

    await useCase.execute('u1', 'password');

    expect(paymentProvider.cancelSubscription).toHaveBeenCalledWith(
      'sub_ext_1',
    );
    expect(subscriptionRepo.deleteManyByRestaurantId).toHaveBeenCalledWith(
      'r1',
    );
  });

  it('rechaza contraseña incorrecta y no borra nada', async () => {
    const {
      useCase,
      passwordHasher,
      userRepo,
      restaurantRepo,
      paymentProvider,
    } = buildUseCase({
      passwordHasher: { verify: jest.fn().mockResolvedValue(false) },
    });

    const result = await useCase.execute('u1', 'wrong');

    expect(result.ok).toBe(false);
    expect(passwordHasher.verify).toHaveBeenCalledWith('wrong', 'hash');
    expect(userRepo.delete).not.toHaveBeenCalled();
    expect(restaurantRepo.delete).not.toHaveBeenCalled();
    expect(paymentProvider.cancelSubscription).not.toHaveBeenCalled();
  });

  it('devuelve error si el usuario no existe', async () => {
    const { useCase } = buildUseCase({
      userRepo: { findById: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute('ghost', 'password');

    expect(result.ok).toBe(false);
  });
});
