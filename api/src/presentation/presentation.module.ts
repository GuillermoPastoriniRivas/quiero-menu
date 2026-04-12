import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InfrastructureModule } from '../infrastructure/infrastructure.module.js';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

// Controllers
import { AuthController } from './controllers/auth.controller.js';
import { StorefrontController } from './controllers/storefront.controller.js';
import { RestaurantController } from './controllers/restaurant.controller.js';
import { MenuController } from './controllers/menu.controller.js';
import { OrderController } from './controllers/order.controller.js';
import { DeliveryZoneController } from './controllers/delivery-zone.controller.js';
import { KitchenController } from './controllers/kitchen.controller.js';
import { OnboardingController } from './controllers/onboarding.controller.js';
import { BillingController } from './controllers/billing.controller.js';
import { PaymentWebhookController } from './controllers/payment-webhook.controller.js';

// Use Cases — Auth
import { LoginUseCase } from '../application/use-cases/auth/login.use-case.js';
import { SignupUseCase } from '../application/use-cases/auth/signup.use-case.js';
import { RefreshTokenUseCase } from '../application/use-cases/auth/refresh-token.use-case.js';
import { GetCurrentUserUseCase } from '../application/use-cases/auth/get-current-user.use-case.js';

// Use Cases — Restaurant
import { GetRestaurantUseCase } from '../application/use-cases/restaurant/get-restaurant.use-case.js';
import { GetRestaurantBySlugUseCase } from '../application/use-cases/restaurant/get-restaurant-by-slug.use-case.js';
import { UpdateRestaurantUseCase } from '../application/use-cases/restaurant/update-restaurant.use-case.js';
import { UpdateOperatingHoursUseCase } from '../application/use-cases/restaurant/update-operating-hours.use-case.js';

// Use Cases — Menu
import { CreateMenuCategoryUseCase } from '../application/use-cases/menu/create-menu-category.use-case.js';
import { UpdateMenuCategoryUseCase } from '../application/use-cases/menu/update-menu-category.use-case.js';
import { DeleteMenuCategoryUseCase } from '../application/use-cases/menu/delete-menu-category.use-case.js';
import { ListMenuCategoriesUseCase } from '../application/use-cases/menu/list-menu-categories.use-case.js';
import { ReorderMenuCategoriesUseCase } from '../application/use-cases/menu/reorder-menu-categories.use-case.js';
import { CreateMenuItemUseCase } from '../application/use-cases/menu/create-menu-item.use-case.js';
import { UpdateMenuItemUseCase } from '../application/use-cases/menu/update-menu-item.use-case.js';
import { DeleteMenuItemUseCase } from '../application/use-cases/menu/delete-menu-item.use-case.js';
import { ToggleMenuItemAvailabilityUseCase } from '../application/use-cases/menu/toggle-menu-item-availability.use-case.js';
import { ReorderMenuItemsUseCase } from '../application/use-cases/menu/reorder-menu-items.use-case.js';
import { CreateMenuItemVariantUseCase } from '../application/use-cases/menu/create-menu-item-variant.use-case.js';
import { UpdateMenuItemVariantUseCase } from '../application/use-cases/menu/update-menu-item-variant.use-case.js';
import { DeleteMenuItemVariantUseCase } from '../application/use-cases/menu/delete-menu-item-variant.use-case.js';
import { CreateMenuItemOptionUseCase } from '../application/use-cases/menu/create-menu-item-option.use-case.js';
import { UpdateMenuItemOptionUseCase } from '../application/use-cases/menu/update-menu-item-option.use-case.js';
import { DeleteMenuItemOptionUseCase } from '../application/use-cases/menu/delete-menu-item-option.use-case.js';

// Use Cases — Order
import { CreateStorefrontOrderUseCase } from '../application/use-cases/order/create-storefront-order.use-case.js';
import { ListOrdersUseCase } from '../application/use-cases/order/list-orders.use-case.js';
import { GetOrderUseCase } from '../application/use-cases/order/get-order.use-case.js';
import { UpdateOrderStatusUseCase } from '../application/use-cases/order/update-order-status.use-case.js';

// Use Cases — Delivery Zone
import { CreateDeliveryZoneUseCase } from '../application/use-cases/delivery-zone/create-delivery-zone.use-case.js';
import { ListDeliveryZonesUseCase } from '../application/use-cases/delivery-zone/list-delivery-zones.use-case.js';
import { UpdateDeliveryZoneUseCase } from '../application/use-cases/delivery-zone/update-delivery-zone.use-case.js';
import { DeleteDeliveryZoneUseCase } from '../application/use-cases/delivery-zone/delete-delivery-zone.use-case.js';

// Use Cases — Kitchen
import { CreateKitchenTokenUseCase } from '../application/use-cases/kitchen/create-kitchen-token.use-case.js';
import { ValidateKitchenTokenUseCase } from '../application/use-cases/kitchen/validate-kitchen-token.use-case.js';
import { ListKitchenTokensUseCase } from '../application/use-cases/kitchen/list-kitchen-tokens.use-case.js';
import { RevokeKitchenTokenUseCase } from '../application/use-cases/kitchen/revoke-kitchen-token.use-case.js';

// Use Cases — Onboarding
import { AnalyzeMenuUseCase } from '../application/use-cases/onboarding/analyze-menu.use-case.js';
import { BulkImportMenuUseCase } from '../application/use-cases/onboarding/bulk-import-menu.use-case.js';

// Use Cases — Billing
import { GetSubscriptionUseCase } from '../application/use-cases/billing/get-subscription.use-case.js';
import { CreateCheckoutUseCase } from '../application/use-cases/billing/create-checkout.use-case.js';
import { HandlePaymentWebhookUseCase } from '../application/use-cases/billing/handle-payment-webhook.use-case.js';
import { CancelSubscriptionUseCase } from '../application/use-cases/billing/cancel-subscription.use-case.js';
import { GetBillingHistoryUseCase } from '../application/use-cases/billing/get-billing-history.use-case.js';

const useCaseProviders = [
  // Auth
  {
    provide: 'LoginUseCase',
    useFactory: (userRepo: any, urRepo: any, rtRepo: any, restRepo: any, hasher: any, tokenProvider: any) =>
      new LoginUseCase(userRepo, urRepo, rtRepo, restRepo, hasher, tokenProvider),
    inject: ['UserRepository', 'UserRestaurantRepository', 'RefreshTokenRepository', 'RestaurantRepository', 'PasswordHasherPort', 'TokenProviderPort'],
  },
  {
    provide: 'SignupUseCase',
    useFactory: (userRepo: any, restRepo: any, urRepo: any, rtRepo: any, hasher: any, tokenProvider: any, subRepo: any) =>
      new SignupUseCase(userRepo, restRepo, urRepo, rtRepo, hasher, tokenProvider, subRepo),
    inject: ['UserRepository', 'RestaurantRepository', 'UserRestaurantRepository', 'RefreshTokenRepository', 'PasswordHasherPort', 'TokenProviderPort', 'SubscriptionRepository'],
  },
  {
    provide: 'RefreshTokenUseCase',
    useFactory: (rtRepo: any, userRepo: any, urRepo: any, tokenProvider: any) =>
      new RefreshTokenUseCase(rtRepo, userRepo, urRepo, tokenProvider),
    inject: ['RefreshTokenRepository', 'UserRepository', 'UserRestaurantRepository', 'TokenProviderPort'],
  },
  {
    provide: 'GetCurrentUserUseCase',
    useFactory: (userRepo: any, urRepo: any, restRepo: any) =>
      new GetCurrentUserUseCase(userRepo, urRepo, restRepo),
    inject: ['UserRepository', 'UserRestaurantRepository', 'RestaurantRepository'],
  },

  // Restaurant
  {
    provide: 'GetRestaurantUseCase',
    useFactory: (restRepo: any) => new GetRestaurantUseCase(restRepo),
    inject: ['RestaurantRepository'],
  },
  {
    provide: 'GetRestaurantBySlugUseCase',
    useFactory: (restRepo: any, catRepo: any, itemRepo: any, varRepo: any, optRepo: any, hoursRepo: any, zoneRepo: any, subRepo: any) =>
      new GetRestaurantBySlugUseCase(restRepo, catRepo, itemRepo, varRepo, optRepo, hoursRepo, zoneRepo, subRepo),
    inject: ['RestaurantRepository', 'MenuCategoryRepository', 'MenuItemRepository', 'MenuItemVariantRepository', 'MenuItemOptionRepository', 'OperatingHoursRepository', 'DeliveryZoneRepository', 'SubscriptionRepository'],
  },
  {
    provide: 'UpdateRestaurantUseCase',
    useFactory: (restRepo: any) => new UpdateRestaurantUseCase(restRepo),
    inject: ['RestaurantRepository'],
  },
  {
    provide: 'UpdateOperatingHoursUseCase',
    useFactory: (hoursRepo: any) => new UpdateOperatingHoursUseCase(hoursRepo),
    inject: ['OperatingHoursRepository'],
  },

  // Menu — Categories
  {
    provide: 'CreateMenuCategoryUseCase',
    useFactory: (catRepo: any) => new CreateMenuCategoryUseCase(catRepo),
    inject: ['MenuCategoryRepository'],
  },
  {
    provide: 'UpdateMenuCategoryUseCase',
    useFactory: (catRepo: any) => new UpdateMenuCategoryUseCase(catRepo),
    inject: ['MenuCategoryRepository'],
  },
  {
    provide: 'DeleteMenuCategoryUseCase',
    useFactory: (catRepo: any, itemRepo: any, varRepo: any, optRepo: any) =>
      new DeleteMenuCategoryUseCase(catRepo, itemRepo, varRepo, optRepo),
    inject: ['MenuCategoryRepository', 'MenuItemRepository', 'MenuItemVariantRepository', 'MenuItemOptionRepository'],
  },
  {
    provide: 'ListMenuCategoriesUseCase',
    useFactory: (catRepo: any) => new ListMenuCategoriesUseCase(catRepo),
    inject: ['MenuCategoryRepository'],
  },
  {
    provide: 'ReorderMenuCategoriesUseCase',
    useFactory: (catRepo: any) => new ReorderMenuCategoriesUseCase(catRepo),
    inject: ['MenuCategoryRepository'],
  },

  // Menu — Items
  {
    provide: 'CreateMenuItemUseCase',
    useFactory: (itemRepo: any, catRepo: any) => new CreateMenuItemUseCase(itemRepo, catRepo),
    inject: ['MenuItemRepository', 'MenuCategoryRepository'],
  },
  {
    provide: 'UpdateMenuItemUseCase',
    useFactory: (itemRepo: any) => new UpdateMenuItemUseCase(itemRepo),
    inject: ['MenuItemRepository'],
  },
  {
    provide: 'DeleteMenuItemUseCase',
    useFactory: (itemRepo: any, varRepo: any, optRepo: any) =>
      new DeleteMenuItemUseCase(itemRepo, varRepo, optRepo),
    inject: ['MenuItemRepository', 'MenuItemVariantRepository', 'MenuItemOptionRepository'],
  },
  {
    provide: 'ToggleMenuItemAvailabilityUseCase',
    useFactory: (itemRepo: any) => new ToggleMenuItemAvailabilityUseCase(itemRepo),
    inject: ['MenuItemRepository'],
  },
  {
    provide: 'ReorderMenuItemsUseCase',
    useFactory: (itemRepo: any) => new ReorderMenuItemsUseCase(itemRepo),
    inject: ['MenuItemRepository'],
  },

  // Menu — Variants
  {
    provide: 'CreateMenuItemVariantUseCase',
    useFactory: (varRepo: any, itemRepo: any) => new CreateMenuItemVariantUseCase(varRepo, itemRepo),
    inject: ['MenuItemVariantRepository', 'MenuItemRepository'],
  },
  {
    provide: 'UpdateMenuItemVariantUseCase',
    useFactory: (varRepo: any, itemRepo: any) => new UpdateMenuItemVariantUseCase(varRepo, itemRepo),
    inject: ['MenuItemVariantRepository', 'MenuItemRepository'],
  },
  {
    provide: 'DeleteMenuItemVariantUseCase',
    useFactory: (varRepo: any, itemRepo: any) => new DeleteMenuItemVariantUseCase(varRepo, itemRepo),
    inject: ['MenuItemVariantRepository', 'MenuItemRepository'],
  },

  // Menu — Options
  {
    provide: 'CreateMenuItemOptionUseCase',
    useFactory: (optRepo: any, itemRepo: any) => new CreateMenuItemOptionUseCase(optRepo, itemRepo),
    inject: ['MenuItemOptionRepository', 'MenuItemRepository'],
  },
  {
    provide: 'UpdateMenuItemOptionUseCase',
    useFactory: (optRepo: any, itemRepo: any) => new UpdateMenuItemOptionUseCase(optRepo, itemRepo),
    inject: ['MenuItemOptionRepository', 'MenuItemRepository'],
  },
  {
    provide: 'DeleteMenuItemOptionUseCase',
    useFactory: (optRepo: any, itemRepo: any) => new DeleteMenuItemOptionUseCase(optRepo, itemRepo),
    inject: ['MenuItemOptionRepository', 'MenuItemRepository'],
  },

  // Order
  {
    provide: 'CreateStorefrontOrderUseCase',
    useFactory: (orderRepo: any, orderItemRepo: any, restRepo: any, itemRepo: any, varRepo: any, optRepo: any, zoneRepo: any) =>
      new CreateStorefrontOrderUseCase(orderRepo, orderItemRepo, restRepo, itemRepo, varRepo, optRepo, zoneRepo),
    inject: ['OrderRepository', 'OrderItemRepository', 'RestaurantRepository', 'MenuItemRepository', 'MenuItemVariantRepository', 'MenuItemOptionRepository', 'DeliveryZoneRepository'],
  },
  {
    provide: 'ListOrdersUseCase',
    useFactory: (orderRepo: any, subRepo: any) => new ListOrdersUseCase(orderRepo, subRepo),
    inject: ['OrderRepository', 'SubscriptionRepository'],
  },
  {
    provide: 'GetOrderUseCase',
    useFactory: (orderRepo: any, orderItemRepo: any, subRepo: any) => new GetOrderUseCase(orderRepo, orderItemRepo, subRepo),
    inject: ['OrderRepository', 'OrderItemRepository', 'SubscriptionRepository'],
  },
  {
    provide: 'UpdateOrderStatusUseCase',
    useFactory: (orderRepo: any, gateway: any) => new UpdateOrderStatusUseCase(orderRepo, gateway),
    inject: ['OrderRepository', 'RealtimeGatewayPort'],
  },

  // Delivery Zone
  {
    provide: 'CreateDeliveryZoneUseCase',
    useFactory: (zoneRepo: any) => new CreateDeliveryZoneUseCase(zoneRepo),
    inject: ['DeliveryZoneRepository'],
  },
  {
    provide: 'ListDeliveryZonesUseCase',
    useFactory: (zoneRepo: any) => new ListDeliveryZonesUseCase(zoneRepo),
    inject: ['DeliveryZoneRepository'],
  },
  {
    provide: 'UpdateDeliveryZoneUseCase',
    useFactory: (zoneRepo: any) => new UpdateDeliveryZoneUseCase(zoneRepo),
    inject: ['DeliveryZoneRepository'],
  },
  {
    provide: 'DeleteDeliveryZoneUseCase',
    useFactory: (zoneRepo: any) => new DeleteDeliveryZoneUseCase(zoneRepo),
    inject: ['DeliveryZoneRepository'],
  },

  // Onboarding
  {
    provide: 'AnalyzeMenuUseCase',
    useFactory: (vision: any, restRepo: any) =>
      new AnalyzeMenuUseCase(vision, restRepo),
    inject: ['MenuVisionPort', 'RestaurantRepository'],
  },
  {
    provide: 'BulkImportMenuUseCase',
    useFactory: (restRepo: any, hoursRepo: any, catRepo: any, itemRepo: any, varRepo: any, optRepo: any) =>
      new BulkImportMenuUseCase(restRepo, hoursRepo, catRepo, itemRepo, varRepo, optRepo),
    inject: ['RestaurantRepository', 'OperatingHoursRepository', 'MenuCategoryRepository', 'MenuItemRepository', 'MenuItemVariantRepository', 'MenuItemOptionRepository'],
  },

  // Billing
  {
    provide: 'GetSubscriptionUseCase',
    useFactory: (subRepo: any, orderRepo: any) =>
      new GetSubscriptionUseCase(subRepo, orderRepo),
    inject: ['SubscriptionRepository', 'OrderRepository'],
  },
  {
    provide: 'CreateCheckoutUseCase',
    useFactory: (subRepo: any, userRepo: any, paymentProvider: any) =>
      new CreateCheckoutUseCase(subRepo, userRepo, paymentProvider),
    inject: ['SubscriptionRepository', 'UserRepository', 'PaymentProviderPort'],
  },
  {
    provide: 'HandlePaymentWebhookUseCase',
    useFactory: (subRepo: any, billingRepo: any, restRepo: any) =>
      new HandlePaymentWebhookUseCase(subRepo, billingRepo, restRepo),
    inject: ['SubscriptionRepository', 'BillingRecordRepository', 'RestaurantRepository'],
  },
  {
    provide: 'CancelSubscriptionUseCase',
    useFactory: (subRepo: any, billingRepo: any, restRepo: any, paymentProvider: any) =>
      new CancelSubscriptionUseCase(subRepo, billingRepo, restRepo, paymentProvider),
    inject: ['SubscriptionRepository', 'BillingRecordRepository', 'RestaurantRepository', 'PaymentProviderPort'],
  },
  {
    provide: 'GetBillingHistoryUseCase',
    useFactory: (billingRepo: any) =>
      new GetBillingHistoryUseCase(billingRepo),
    inject: ['BillingRecordRepository'],
  },

  // Kitchen
  {
    provide: 'CreateKitchenTokenUseCase',
    useFactory: (tokenRepo: any) => new CreateKitchenTokenUseCase(tokenRepo),
    inject: ['KitchenAccessTokenRepository'],
  },
  {
    provide: 'ValidateKitchenTokenUseCase',
    useFactory: (tokenRepo: any) => new ValidateKitchenTokenUseCase(tokenRepo),
    inject: ['KitchenAccessTokenRepository'],
  },
  {
    provide: 'ListKitchenTokensUseCase',
    useFactory: (tokenRepo: any) => new ListKitchenTokensUseCase(tokenRepo),
    inject: ['KitchenAccessTokenRepository'],
  },
  {
    provide: 'RevokeKitchenTokenUseCase',
    useFactory: (tokenRepo: any) => new RevokeKitchenTokenUseCase(tokenRepo),
    inject: ['KitchenAccessTokenRepository'],
  },
];

@Module({
  imports: [InfrastructureModule],
  controllers: [
    AuthController,
    StorefrontController,
    RestaurantController,
    MenuController,
    OrderController,
    DeliveryZoneController,
    KitchenController,
    OnboardingController,
    BillingController,
    PaymentWebhookController,
  ],
  providers: [
    ...useCaseProviders,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class PresentationModule {}
