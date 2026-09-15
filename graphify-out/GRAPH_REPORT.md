# Graph Report - quiero-menu  (2026-09-15)

## Corpus Check
- 544 files · ~159,639 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3346 nodes · 10317 edges · 138 communities (118 shown, 14 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 522 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a85e2c5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OrderStatus
- result.ts
- ok
- orders/page.tsx
- mi-menu/page.tsx
- cn
- PlanTier
- BillingEventType
- mongo-analytics.repository.ts
- UserRepository
- react
- tracking/[code]/page.tsx
- signup.use-case.spec.ts
- StoreClaimRepository
- persistence.module.ts
- Result
- PushSubscription
- OperatingHours
- Coupon
- @nestjs/common
- api/package.json
- s3-storage.service.ts
- DeliveryAccessToken
- restaurant.entity.ts
- useAuthStore
- analyze-menu.use-case.ts
- RestaurantRepository
- kitchen.controller.ts
- backfill-directory-data.use-case.spec.ts
- Quiero.Menu - Guia de Deploy
- menu/page.tsx
- app/page.tsx
- infrastructure.module.ts
- FeaturedSlotRepository
- mongo-kitchen-access-token.repository.ts
- Public
- types/index.ts
- imprimir/page.tsx
- devDependencies
- [...geo]/page.tsx
- search-storefronts.use-case.ts
- auth.controller.ts
- admin.controller.ts
- CurrentUser
- backfill-directory-data.use-case.ts
- mongo-verification-token.repository.ts
- dependencies
- push.controller.ts
- mongo-audit-log.repository.ts
- mongo-menu-item-option.repository.ts
- compilerOptions
- mongo-menu-category.repository.ts
- mongo-menu-item-variant.repository.ts
- components.json
- mongo-refresh-token.repository.ts
- mongo-user.repository.ts
- restaurant.controller.ts
- presentation.module.ts
- ui/package.json
- tracking.controller.ts
- SocketIoGatewayService
- mongo-user-restaurant.repository.ts
- app/locales/page.tsx
- compilerOptions
- signup.use-case.ts
- ListActiveStorefrontsUseCase
- list-orders.use-case.ts
- menu.controller.ts
- get-order-tracking.use-case.ts
- next
- dependencies
- main.ts
- DeliveryController
- create-unclaimed-restaurant.use-case.ts
- settings/page.tsx
- directory-search.tsx
- ApiClient
- scripts
- order.repository.ts
- Order
- domain-errors.ts
- customers.controller.ts
- manifest.json
- storefront-json-ld.tsx
- coupon.controller.ts
- app/layout.tsx
- jest
- Restaurant
- CustomDomainController
- Backup y restore de MongoDB
- Dominio personalizado para el storefront (quiero.menu)
- generate-icons.mjs
- api/README.md
- devDependencies
- cookie-consent.tsx
- mercado-pago-payment.service.ts
- .changeStatus
- nest-cli.json
- [Unreleased]
- Email entrante en quiero.menu (SES inbound)
- StorefrontEventType
- set-custom-domain.use-case.ts
- custom-domain-worker.sh
- scripts
- @nestjs/config
- tsconfig.build.json
- ui/README.md
- data/page.tsx
- MenuItemType
- RestaurantStatus
- UserRole
- SearchTerm
- backup-mongo.sh
- sw.js
- onboarding.controller.ts
- User
- payment-webhook.controller.ts
- MercadoPagoPaymentService
- hydrate-env.sh
- user-data.sh
- AGENTS.md
- ui/eslint.config.mjs
- postcss.config.mjs
- gtag.d.ts
- WebhookEvent
- Subscription
- directory-geo.ts
- MongoStorefrontViewRepository
- storefront-index.ts
- confirm-delivery.use-case.spec.ts
- .overview
- ListCustomerOrdersUseCase

## God Nodes (most connected - your core abstractions)
1. `Result` - 131 edges
2. `ok()` - 129 edges
3. `cn()` - 124 edges
4. `err()` - 120 edges
5. `RestaurantRepository` - 101 edges
6. `@nestjs/common` - 84 edges
7. `react` - 78 edges
8. `RequestUser` - 77 edges
9. `CurrentUser` - 77 edges
10. `Restaurant` - 72 edges

## Surprising Connections (you probably didn't know these)
- `PlanInfo` --references--> `PlanTier`  [EXTRACTED]
  api/src/application/use-cases/order/list-orders.use-case.ts → api/src/domain/enums/plan-tier.enum.ts
- `makeRestaurant()` --calls--> `Restaurant`  [EXTRACTED]
  api/src/application/use-cases/restaurant/backfill-directory-data.use-case.spec.ts → api/src/domain/entities/restaurant.entity.ts
- `makeItem()` --calls--> `MenuItem`  [EXTRACTED]
  api/src/application/use-cases/restaurant/backfill-directory-data.use-case.spec.ts → api/src/domain/entities/menu-item.entity.ts
- `makeRestaurant()` --calls--> `Restaurant`  [EXTRACTED]
  api/src/application/use-cases/restaurant/search-storefronts.use-case.spec.ts → api/src/domain/entities/restaurant.entity.ts
- `makeItem()` --calls--> `MenuItem`  [EXTRACTED]
  api/src/application/use-cases/restaurant/search-storefronts.use-case.spec.ts → api/src/domain/entities/menu-item.entity.ts

## Import Cycles
- None detected.

## Communities (138 total, 14 thin omitted)

### Community 0 - "OrderStatus"
Cohesion: 0.10
Nodes (24): CreateStorefrontOrderInput, buildUseCase(), makeOrder(), makeRestaurant(), build(), makeOrder(), makeRestaurant(), StatusTransition (+16 more)

### Community 1 - "result.ts"
Cohesion: 0.06
Nodes (21): CreateMenuItemOptionUseCase, CreateMenuItemUseCase, CreateMenuItemVariantUseCase, DeleteMenuCategoryUseCase, DeleteMenuItemOptionUseCase, DeleteMenuItemUseCase, DeleteMenuItemVariantUseCase, ReorderMenuItemsUseCase (+13 more)

### Community 2 - "ok"
Cohesion: 0.09
Nodes (22): ok(), ImageType, RecordStorefrontEventUseCase, localDateString(), RecordStorefrontViewUseCase, RequestStoreClaimInput, RequestStoreClaimUseCase, GetCustomDomainUseCase (+14 more)

### Community 3 - "orders/page.tsx"
Cohesion: 0.06
Nodes (70): AdminActivityPage(), AdminDestacadosPage(), AdminLocalesPage(), ClaimCard(), AnalyticsPage(), CustomersPage(), DeliveryFilter, Tab (+62 more)

### Community 4 - "mi-menu/page.tsx"
Cohesion: 0.09
Nodes (43): sonner, AccountPage(), STAGE_LABELS, STATUS_LABELS, Draft, MiMenuPageInner(), MiMenuTab, PRESET_COLORS (+35 more)

### Community 5 - "cn"
Cohesion: 0.04
Nodes (67): BillingPage(), EVENT_META, eventMeta(), STATE_BADGE, STATE_ICON, STATE_ICON_CLASS, subscriptionStatus(), CustomDomainCard() (+59 more)

### Community 6 - "PlanTier"
Cohesion: 0.15
Nodes (21): SubscriptionInfo, PLAN_LIMITS, PlanLimits, PaymentProvider, LEMON_SQUEEZY, MERCADO_PAGO, NONE, PlanTier (+13 more)

### Community 7 - "BillingEventType"
Cohesion: 0.11
Nodes (18): GetBillingHistoryUseCase, BillingRecord, BillingEventType, PAYMENT_FAILED, PAYMENT_SUCCESS, PLAN_CHANGED, SUBSCRIPTION_CANCELED, SUBSCRIPTION_CREATED (+10 more)

### Community 8 - "mongo-analytics.repository.ts"
Cohesion: 0.10
Nodes (16): AnalyticsOverview, AnalyticsRange, GetAnalyticsOverviewUseCase, startOfZonedDay(), zonedOffsetMs(), AnalyticsRepository, DailySalesPoint, HourlySalesPoint (+8 more)

### Community 9 - "UserRepository"
Cohesion: 0.10
Nodes (22): EmailMessage, EmailServicePort, PasswordHasherPort, CreateRestaurantAccountInput, CreateRestaurantAccountOutput, CreateRestaurantAccountUseCase, buildUseCase(), ForgotPasswordUseCase (+14 more)

### Community 10 - "react"
Cohesion: 0.05
Nodes (41): browser-image-compression, react, EVENT_ICONS, FeaturedSlotItem, AdminNuevoLocalPage(), deriveSlug(), generatePassword(), STATUS_TABS (+33 more)

### Community 11 - "tracking/[code]/page.tsx"
Cohesion: 0.09
Nodes (40): socket.io-client, ChecklistStep, DashboardPage(), OrdersPage(), STATUS_ICONS, STATUS_LABELS, STATUS_STEPS, TrackingPage() (+32 more)

### Community 12 - "signup.use-case.spec.ts"
Cohesion: 0.11
Nodes (21): LoginInput, TokenProviderPort, ImpersonateRestaurantOwnerUseCase, ImpersonationOutput, buildUseCase(), LoginUseCase, buildUseCase(), LogoutUseCase (+13 more)

### Community 13 - "StoreClaimRepository"
Cohesion: 0.08
Nodes (21): StoreClaimListItem, deps(), makeClaim(), makeRestaurant(), StoreClaim, StoreClaimStatus, CreateStoreClaimData, StoreClaimRepository (+13 more)

### Community 14 - "persistence.module.ts"
Cohesion: 0.07
Nodes (39): MongoSearchTermRepository, Injectable, InjectModel, AuditLogSchema, FeaturedSlotModel, FeaturedSlotSchema, Prop, Schema (+31 more)

### Community 15 - "Result"
Cohesion: 0.09
Nodes (10): isPlatformAdminEmail(), err(), Result, GetAccountDataUseCase, CurrentUserOutput, GetCurrentUserUseCase, CreateCheckoutUseCase, GetOrderTrackingUseCase (+2 more)

### Community 16 - "PushSubscription"
Cohesion: 0.07
Nodes (19): PushPayload, PushSubscription, PushSubscriptionKeys, CreatePushSubscriptionData, PushSubscriptionRepository, PushSubscriptionMapper, MongoPushSubscriptionRepository, Injectable (+11 more)

### Community 17 - "OperatingHours"
Cohesion: 0.08
Nodes (26): makeHours(), GetRestaurantOperatingHoursUseCase, RestaurantOperatingHoursData, buildUseCase(), makeHours(), makeRestaurant(), UpdateOpenStatusUseCase, UpdateOperatingHoursUseCase (+18 more)

### Community 18 - "Coupon"
Cohesion: 0.10
Nodes (18): CouponDiscountResult, makeCoupon(), CreateCouponInput, ValidateCouponOutput, Coupon, CouponType, FIXED, FREE_DELIVERY (+10 more)

### Community 19 - "@nestjs/common"
Cohesion: 0.06
Nodes (32): CancelSubscriptionUseCase, GetSubscriptionUseCase, AccountController, Body, Controller, Delete, Inject, Inject (+24 more)

### Community 20 - "api/package.json"
Cohesion: 0.05
Nodes (42): author, description, eslint, @types/node, typescript, license, name, private (+34 more)

### Community 21 - "s3-storage.service.ts"
Cohesion: 0.10
Nodes (15): PresignedUrlRequest, PresignedUrlResponse, StoragePort, StoredObject, EXTENSION_MAP, S3StorageService, Injectable, Controller (+7 more)

### Community 22 - "DeliveryAccessToken"
Cohesion: 0.10
Nodes (14): CreateDeliveryTokenUseCase, generateCode(), ListDeliveryTokensUseCase, DeliveryAccessToken, DeliveryAccessTokenRepository, DeliveryAccessTokenMapper, MongoDeliveryAccessTokenRepository, Injectable (+6 more)

### Community 23 - "restaurant.entity.ts"
Cohesion: 0.08
Nodes (32): CreateUnclaimedRestaurantInput, CustomDomainInfo, ListPendingCustomDomainsUseCase, PendingCustomDomain, AssignFeaturedSlotUseCase, MAX_CATEGORY_SLOTS, deps(), RESTAURANT_CATEGORIES (+24 more)

### Community 24 - "useAuthStore"
Cohesion: 0.10
Nodes (27): AdminNavItem(), AdminUserMenu(), NAV_ITEMS, AdminLocalDetailPage(), metadata, AdminGate(), AuthProvider(), AdminSidebar() (+19 more)

### Community 25 - "analyze-menu.use-case.ts"
Cohesion: 0.16
Nodes (10): MenuVisionCategory, MenuVisionInput, MenuVisionItem, MenuVisionOutput, MenuVisionPort, AnalyzeMenuUseCase, JSON_SCHEMA, OpenAiMenuVisionService (+2 more)

### Community 26 - "RestaurantRepository"
Cohesion: 0.08
Nodes (20): PaymentProviderPort, DeleteAccountUseCase, buildUseCase(), AdminRestaurantDetailOutput, GetRestaurantDetailUseCase, AdminRestaurantListItem, SearchRestaurantsUseCase, buildUseCase() (+12 more)

### Community 27 - "kitchen.controller.ts"
Cohesion: 0.06
Nodes (27): CreateKitchenTokenUseCase, generateCode(), ListKitchenTokensUseCase, RevokeKitchenTokenUseCase, ValidateKitchenTokenUseCase, GetOrderUseCase, ListOrdersUseCase, UpdateOrderStatusUseCase (+19 more)

### Community 28 - "backfill-directory-data.use-case.spec.ts"
Cohesion: 0.09
Nodes (15): makeItem(), makeRestaurant(), MenuItemType, COMBO, SIMPLE, VARIANT, MenuItemMapper, MongoMenuItemRepository (+7 more)

### Community 29 - "Quiero.Menu - Guia de Deploy"
Cohesion: 0.06
Nodes (33): Checklist post-deploy:, CloudFront / imagenes no cargan, Comandos utiles en el servidor:, Configurar credenciales AWS, El sitio no carga, Emails configurados, Emails no llegan, Estructura de archivos en el servidor (+25 more)

### Community 30 - "menu/page.tsx"
Cohesion: 0.10
Nodes (22): CatDialog, ItemDialog, MenuPage(), OptionDialog, RichCategory, RichItem, VariantDialog, AccessManagerDialog() (+14 more)

### Community 31 - "app/page.tsx"
Cohesion: 0.06
Nodes (19): BENTO_FEATURES, faqJsonLd, faqs, getLiveStores(), LandingPage(), LIVE_STORES, MARQUEE_ITEMS, metadata (+11 more)

### Community 32 - "infrastructure.module.ts"
Cohesion: 0.13
Nodes (14): AiModule, Module, EmailModule, Module, InfrastructureModule, Module, PaymentModule, Module (+6 more)

### Community 33 - "FeaturedSlotRepository"
Cohesion: 0.12
Nodes (13): AssignFeaturedSlotInput, FeaturedSlotListItem, ListFeaturedSlotsUseCase, FeaturedSlotRef, FeaturedScope, FeaturedSlot, CreateFeaturedSlotData, FeaturedSlotRepository (+5 more)

### Community 34 - "mongo-kitchen-access-token.repository.ts"
Cohesion: 0.36
Nodes (6): KitchenAccessTokenMapper, KitchenAccessTokenDocument, KitchenAccessTokenModel, KitchenAccessTokenSchema, Prop, Schema

### Community 35 - "Public"
Cohesion: 0.15
Nodes (15): HealthController, Controller, Get, Inject, StorefrontController, Body, Controller, Get (+7 more)

### Community 36 - "types/index.ts"
Cohesion: 0.05
Nodes (60): zustand, OnboardingFlow(), deriveSlug(), SignupForm(), AiMenuPreviewProps, FullMenuItem, StorefrontView(), useMediaQuery() (+52 more)

### Community 37 - "imprimir/page.tsx"
Cohesion: 0.21
Nodes (11): qrcode.react, hoursLabel(), ImprimirPage(), SHORT_DAYS, BrandedQr(), BrandedQrProps, imageProxyUrl(), IconBase() (+3 more)

### Community 38 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+20 more)

### Community 39 - "[...geo]/page.tsx"
Cohesion: 0.19
Nodes (24): breadcrumbsForCity(), CategoryView(), CityView(), CountryHub(), dynamic, generateMetadata(), GeoDirectoryPage(), groupByCity() (+16 more)

### Community 40 - "search-storefronts.use-case.ts"
Cohesion: 0.11
Nodes (18): ListSearchTermsUseCase, ActiveStorefrontSummary, matches(), normalize(), searchable(), SearchStorefrontsUseCase, makeItem(), makeRestaurant() (+10 more)

### Community 41 - "auth.controller.ts"
Cohesion: 0.19
Nodes (17): AuthController, Body, Controller, Post, Throttle, ForgotPasswordRequestDto, ForgotPasswordRequestSchema, LoginRequestDto (+9 more)

### Community 42 - "admin.controller.ts"
Cohesion: 0.10
Nodes (28): AdminController, Body, Controller, Get, Param, Patch, Post, Query (+20 more)

### Community 43 - "CurrentUser"
Cohesion: 0.09
Nodes (24): Get, Get, BillingController, Controller, Get, Post, Get, Delete (+16 more)

### Community 44 - "backfill-directory-data.use-case.ts"
Cohesion: 0.13
Nodes (8): BackfillDirectoryDataUseCase, BackfillDirectoryResult, CATEGORY_KEYWORDS, inferCategory(), normalize(), DirectoryBackfillService, Inject, Injectable

### Community 45 - "mongo-verification-token.repository.ts"
Cohesion: 0.16
Nodes (12): TokenType, VerificationToken, CreateVerificationTokenData, VerificationTokenMapper, MongoVerificationTokenRepository, Injectable, InjectModel, Prop (+4 more)

### Community 46 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @aws-sdk/client-s3, @aws-sdk/client-ses, @aws-sdk/s3-request-presigner, bcrypt, helmet, mongoose, @nestjs/common (+16 more)

### Community 47 - "push.controller.ts"
Cohesion: 0.12
Nodes (15): PushServicePort, PushController, Body, Controller, Delete, Get, Inject, Post (+7 more)

### Community 48 - "mongo-audit-log.repository.ts"
Cohesion: 0.13
Nodes (14): AdminAuditLogItem, ListAuditLogsUseCase, buildUseCase(), AuditLogEntry, CreateAuditLogEntryData, AuditLogRepository, MongoAuditLogRepository, Injectable (+6 more)

### Community 49 - "mongo-menu-item-option.repository.ts"
Cohesion: 0.13
Nodes (9): MenuItemOptionMapper, MongoMenuItemOptionRepository, Injectable, InjectModel, MenuItemOptionDocument, MenuItemOptionModel, MenuItemOptionSchema, Prop (+1 more)

### Community 50 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 51 - "mongo-menu-category.repository.ts"
Cohesion: 0.13
Nodes (9): MenuCategoryMapper, MongoMenuCategoryRepository, Injectable, InjectModel, MenuCategoryDocument, MenuCategoryModel, MenuCategorySchema, Prop (+1 more)

### Community 52 - "mongo-menu-item-variant.repository.ts"
Cohesion: 0.13
Nodes (9): MenuItemVariantMapper, MongoMenuItemVariantRepository, Injectable, InjectModel, MenuItemVariantDocument, MenuItemVariantModel, MenuItemVariantSchema, Prop (+1 more)

### Community 53 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 54 - "mongo-refresh-token.repository.ts"
Cohesion: 0.17
Nodes (9): RefreshTokenMapper, MongoRefreshTokenRepository, Injectable, InjectModel, RefreshTokenDocument, RefreshTokenModel, RefreshTokenSchema, Prop (+1 more)

### Community 55 - "mongo-user.repository.ts"
Cohesion: 0.27
Nodes (7): UserMapper, InjectModel, Prop, Schema, UserDocument, UserModel, UserSchema

### Community 56 - "restaurant.controller.ts"
Cohesion: 0.20
Nodes (11): RestaurantController, Body, Controller, Get, Patch, UpdateOpenStatusRequestDto, UpdateOpenStatusRequestSchema, UpdateOperatingHoursRequestDto (+3 more)

### Community 57 - "presentation.module.ts"
Cohesion: 0.09
Nodes (17): computeCouponDiscount(), isCouponApplicable(), RealtimeGatewayPort, CreateCouponUseCase, DeleteCouponUseCase, ListCouponsUseCase, UpdateCouponUseCase, ValidateCouponUseCase (+9 more)

### Community 58 - "ui/package.json"
Cohesion: 0.11
Nodes (18): @base-ui/react, clsx, eslint-config-next, next-themes, react-dom, shadcn, tailwind-merge, tailwindcss (+10 more)

### Community 59 - "tracking.controller.ts"
Cohesion: 0.12
Nodes (13): TrackingController, Body, Controller, Get, Inject, Param, Post, Throttle (+5 more)

### Community 60 - "SocketIoGatewayService"
Cohesion: 0.09
Nodes (14): AuthInfraModule, Module, SocketIoGatewayService, Inject, Injectable, Module, WebSocketInfraModule, JwtAuthGuard (+6 more)

### Community 61 - "mongo-user-restaurant.repository.ts"
Cohesion: 0.16
Nodes (9): UserRestaurantMapper, MongoUserRestaurantRepository, Injectable, InjectModel, Prop, Schema, UserRestaurantDocument, UserRestaurantModel (+1 more)

### Community 62 - "app/locales/page.tsx"
Cohesion: 0.22
Nodes (10): baseMetadata, dynamic, groupByCity(), LocalesPage(), BreadcrumbsJsonLd(), DirectoryJsonLd(), Item, FeaturedContext (+2 more)

### Community 63 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 64 - "signup.use-case.ts"
Cohesion: 0.14
Nodes (12): LoginOutput, SignupInput, SignupUseCase, ApproveStoreClaimInput, ApproveStoreClaimUseCase, makeApprove(), baseLayout(), claimApprovedTemplate() (+4 more)

### Community 65 - "ListActiveStorefrontsUseCase"
Cohesion: 0.20
Nodes (7): ListActiveStorefrontsUseCase, StorefrontsIndexController, Controller, Get, Inject, Query, Throttle

### Community 66 - "list-orders.use-case.ts"
Cohesion: 0.10
Nodes (17): CreateStorefrontOrderOutput, GetOrderOutput, ListOrdersOutput, OrderWithRedaction, PlanInfo, OrderItem, SelectedOption, OrderItemMapper (+9 more)

### Community 67 - "menu.controller.ts"
Cohesion: 0.09
Nodes (25): CreateMenuCategoryUseCase, ListMenuCategoriesUseCase, ReorderMenuCategoriesUseCase, UpdateMenuCategoryUseCase, GetRestaurantBySlugUseCase, StorefrontData, MenuCategory, MenuCategoryRepository (+17 more)

### Community 68 - "get-order-tracking.use-case.ts"
Cohesion: 0.15
Nodes (15): generateTrackingToken(), normalizeTrackingToken(), ConfirmDeliveryInput, ConfirmDeliveryOutput, OrderTrackingOutput, OrderFeedback, OrderFeedbackRating, PaymentMethodsConfig (+7 more)

### Community 69 - "next"
Cohesion: 0.15
Nodes (6): next, nextConfig, metadata, APP_ROUTES, dynamic, metadata

### Community 70 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @base-ui/react, browser-image-compression, class-variance-authority, clsx, next, next-themes, qrcode.react (+9 more)

### Community 71 - "main.ts"
Cohesion: 0.17
Nodes (10): LOG_LEVELS, parseLogLevels(), StructuredLogger, Injectable, bootstrap(), GlobalExceptionFilter, Catch, helmet (+2 more)

### Community 72 - "DeliveryController"
Cohesion: 0.24
Nodes (8): DeliveryController, Body, Controller, Delete, Get, Param, Post, Req

### Community 74 - "create-unclaimed-restaurant.use-case.ts"
Cohesion: 0.14
Nodes (11): CITY_GEO, DerivedGeo, deriveGeoFromCity(), COUNTRY_SLUG_BY_CODE, countrySlugFrom(), slugifyCity(), BulkImportMenuUseCase, BulkImportResult (+3 more)

### Community 75 - "settings/page.tsx"
Cohesion: 0.22
Nodes (9): class-variance-authority, LEGACY_TAB_REDIRECTS, SETTINGS_TABS, SettingsTab, Tabs(), TabsContent(), TabsList(), tabsListVariants (+1 more)

### Community 76 - "directory-search.tsx"
Cohesion: 0.21
Nodes (15): DirectoryCityOption, DirectorySearch(), SUGGESTION_LABELS, StoreCard(), waDigits(), formatUpdatedDate(), CATEGORY_TEXT, fetchStorefrontIndex() (+7 more)

### Community 78 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, backfill:tracking-tokens, build, format, lint, start, start:debug, start:dev (+6 more)

### Community 79 - "order.repository.ts"
Cohesion: 0.14
Nodes (14): ListCustomersInput, ListCustomersUseCase, CustomerFilters, CustomerSummary, OrderFilters, PaginatedResult, OrderMapper, InjectModel (+6 more)

### Community 80 - "Order"
Cohesion: 0.12
Nodes (4): redactOrder(), Order, MongoOrderRepository, Injectable

### Community 81 - "domain-errors.ts"
Cohesion: 0.07
Nodes (19): CreateCheckoutInput, RejectStoreClaimUseCase, RevokeDeliveryTokenUseCase, ValidateDeliveryTokenUseCase, MAX_HOME_SLOTS, ClaimNotPendingError, CouponInvalidError, CustomDomainNotConfiguredError (+11 more)

### Community 82 - "customers.controller.ts"
Cohesion: 0.26
Nodes (9): CustomerController, Controller, Get, Param, Query, ListCustomerOrdersQueryDto, ListCustomerOrdersQuerySchema, ListCustomersQueryDto (+1 more)

### Community 83 - "manifest.json"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, id, name, orientation (+4 more)

### Community 84 - "storefront-json-ld.tsx"
Cohesion: 0.22
Nodes (11): StorefrontPage(), ClaimPage(), dynamic, generateMetadata(), ClaimForm(), isValidTime(), omitEmpty(), priceRange() (+3 more)

### Community 85 - "coupon.controller.ts"
Cohesion: 0.16
Nodes (13): CouponController, Body, Controller, Delete, Param, Patch, Post, CreateCouponRequestDto (+5 more)

### Community 86 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): @sentry/nextjs, inter, metadata, plusJakartaSans, poppins, RegisterSW(), SentryInit(), Toaster()

### Community 87 - "jest"
Cohesion: 0.18
Nodes (11): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, testEnvironment, testRegex (+3 more)

### Community 88 - "Restaurant"
Cohesion: 0.14
Nodes (8): makeRestaurant(), makeRestaurant(), makeRestaurant(), Restaurant, makeRestaurant(), MongoRestaurantRepository, Injectable, InjectModel

### Community 89 - "CustomDomainController"
Cohesion: 0.25
Nodes (6): CustomDomainController, Body, Controller, Inject, SetCustomDomainRequestDto, Put

### Community 90 - "Backup y restore de MongoDB"
Cohesion: 0.18
Nodes (10): Arquitectura, Backup y restore de MongoDB, Instalación en el servidor (una vez), Prerequisitos, Procedimiento (con pérdida de datos controlada — `--drop`), Prueba manual, Restore, Restore en caso de desastre (cluster nuevo) (+2 more)

### Community 91 - "Dominio personalizado para el storefront (quiero.menu)"
Cohesion: 0.18
Nodes (10): API (`api/.env` / SSM), Configuración, Cómo funciona, DNS del cliente, Dominio personalizado para el storefront (quiero.menu), Endpoints internos (worker), Gotchas / seguridad, Nginx compartido (+2 more)

### Community 92 - "generate-icons.mjs"
Cohesion: 0.18
Nodes (8): sharp, __dirname, maskable, publicDir, reduced, src, __dirname, outPath

### Community 93 - "api/README.md"
Cohesion: 0.20
Nodes (9): Compile and run the project, Deployment, Description, License, Project setup, Resources, Run tests, Stay in touch (+1 more)

### Community 94 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, sharp, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+2 more)

### Community 95 - "cookie-consent.tsx"
Cohesion: 0.33
Nodes (7): CookieConsent(), subscribeNever(), GoogleAnalytics(), ConsentState, ConsentStatus, readConsent(), useConsentStore

### Community 96 - "mercado-pago-payment.service.ts"
Cohesion: 0.13
Nodes (12): CreateCheckoutParams, CreateCheckoutResult, WebhookEventType, WebhookSignatureContext, LemonSqueezyPaymentService, LemonSqueezyWebhookPayload, Injectable, AuthorizedPayment (+4 more)

### Community 97 - ".changeStatus"
Cohesion: 0.20
Nodes (9): OrderController, Body, Controller, Get, Param, Patch, Query, OrderQueryParamsDto (+1 more)

### Community 98 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 99 - "[Unreleased]"
Cohesion: 0.33
Nodes (5): Added, Changed, Changelog, Fixed, [Unreleased]

### Community 100 - "Email entrante en quiero.menu (SES inbound)"
Cohesion: 0.33
Nodes (5): Agregar una casilla, Cómo funciona (`infra/terraform/email-inbound.tf`), Email entrante en quiero.menu (SES inbound), Por qué no un Lambda, Verificar que funciona

### Community 101 - "StorefrontEventType"
Cohesion: 0.11
Nodes (11): StorefrontEvent, StorefrontEventType, INSTAGRAM, MAPS, WHATSAPP, EventTypeCount, MongoStorefrontEventRepository, Injectable (+3 more)

### Community 102 - "set-custom-domain.use-case.ts"
Cohesion: 0.24
Nodes (9): SetCustomDomainUseCase, buildUseCase(), makeRestaurant(), CustomDomainAlreadyInUseError, CustomDomainInvalidError, CustomDomainRequiresProError, isOwnDomain(), normalizeDomain() (+1 more)

### Community 103 - "custom-domain-worker.sh"
Cohesion: 0.80
Nodes (4): mark_status(), provision(), reload_nginx(), custom-domain-worker.sh script

### Community 104 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 105 - "@nestjs/config"
Cohesion: 0.18
Nodes (7): TokenPayload, BcryptHasherService, Injectable, JwtTokenService, Injectable, @nestjs/config, @nestjs/jwt

### Community 106 - "tsconfig.build.json"
Cohesion: 0.50
Nodes (3): exclude, extends, ./tsconfig.json

### Community 107 - "ui/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 109 - "MenuItemType"
Cohesion: 0.50
Nodes (4): MenuItemType, COMBO, SIMPLE, VARIANT

### Community 110 - "RestaurantStatus"
Cohesion: 0.50
Nodes (4): RestaurantStatus, ACTIVE, PAUSED, SUSPENDED

### Community 111 - "UserRole"
Cohesion: 0.50
Nodes (4): UserRole, KITCHEN, MANAGER, OWNER

### Community 116 - "onboarding.controller.ts"
Cohesion: 0.18
Nodes (11): ALLOWED_MIMES, OnboardingController, Body, Controller, Post, ImportMenuRequestDto, ImportMenuRequestSchema, MenuVisionCategorySchema (+3 more)

### Community 117 - "User"
Cohesion: 0.26
Nodes (3): User, MongoUserRepository, Injectable

### Community 118 - "payment-webhook.controller.ts"
Cohesion: 0.21
Nodes (7): MercadoPagoWebhookBody, PaymentWebhookController, RequestWithRawBody, Controller, Inject, Post, Req

### Community 131 - "Subscription"
Cohesion: 0.31
Nodes (4): Subscription, MongoSubscriptionRepository, Injectable, InjectModel

### Community 132 - "directory-geo.ts"
Cohesion: 0.31
Nodes (8): CitySection, FichaView(), CityGroup, COUNTRY_LABELS, countryLabel(), subdivisionLabel(), StorefrontIndexState, StorefrontIndexEntry

### Community 133 - "MongoStorefrontViewRepository"
Cohesion: 0.33
Nodes (3): MongoStorefrontViewRepository, Injectable, InjectModel

### Community 134 - "storefront-index.ts"
Cohesion: 0.53
Nodes (3): generateMetadata(), getStorefrontIndex(), getStorefrontIndexState()

### Community 135 - "confirm-delivery.use-case.spec.ts"
Cohesion: 0.60
Nodes (3): ConfirmDeliveryUseCase, deps(), makeOrder()

### Community 136 - ".overview"
Cohesion: 0.40
Nodes (4): AnalyticsController, Controller, Get, Query

## Knowledge Gaps
- **561 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+556 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1020 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `ok`, `PlanTier`, `BillingEventType`, `mongo-analytics.repository.ts`, `UserRepository`, `StoreClaimRepository`, `persistence.module.ts`, `PushSubscription`, `OperatingHours`, `Coupon`, `api/package.json`, `s3-storage.service.ts`, `DeliveryAccessToken`, `restaurant.entity.ts`, `analyze-menu.use-case.ts`, `kitchen.controller.ts`, `backfill-directory-data.use-case.spec.ts`, `infrastructure.module.ts`, `FeaturedSlotRepository`, `mongo-kitchen-access-token.repository.ts`, `auth.controller.ts`, `admin.controller.ts`, `backfill-directory-data.use-case.ts`, `mongo-verification-token.repository.ts`, `push.controller.ts`, `mongo-audit-log.repository.ts`, `mongo-menu-item-option.repository.ts`, `mongo-menu-category.repository.ts`, `mongo-menu-item-variant.repository.ts`, `mongo-refresh-token.repository.ts`, `mongo-user.repository.ts`, `restaurant.controller.ts`, `presentation.module.ts`, `tracking.controller.ts`, `SocketIoGatewayService`, `mongo-user-restaurant.repository.ts`, `list-orders.use-case.ts`, `menu.controller.ts`, `get-order-tracking.use-case.ts`, `main.ts`, `order.repository.ts`, `customers.controller.ts`, `coupon.controller.ts`, `mercado-pago-payment.service.ts`, `@nestjs/config`, `onboarding.controller.ts`, `payment-webhook.controller.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `api/package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `RestaurantRepository` connect `RestaurantRepository` to `result.ts`, `ok`, `PlanTier`, `mongo-analytics.repository.ts`, `UserRepository`, `signup.use-case.spec.ts`, `StoreClaimRepository`, `Result`, `OperatingHours`, `restaurant.entity.ts`, `backfill-directory-data.use-case.spec.ts`, `FeaturedSlotRepository`, `search-storefronts.use-case.ts`, `backfill-directory-data.use-case.ts`, `presentation.module.ts`, `signup.use-case.ts`, `ListActiveStorefrontsUseCase`, `menu.controller.ts`, `get-order-tracking.use-case.ts`, `.deleteRestaurant`, `create-unclaimed-restaurant.use-case.ts`, `domain-errors.ts`, `Restaurant`, `set-custom-domain.use-case.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _561 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OrderStatus` be split into smaller, more focused modules?**
  _Cohesion score 0.10114942528735632 - nodes in this community are weakly interconnected._
- **Should `result.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06235069278547539 - nodes in this community are weakly interconnected._
- **Should `ok` be split into smaller, more focused modules?**
  _Cohesion score 0.08603145235892692 - nodes in this community are weakly interconnected._