# Graph Report - quiero-menu  (2026-09-14)

## Corpus Check
- 542 files · ~157,948 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3338 nodes · 10278 edges · 130 communities (107 shown, 13 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 520 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46152af7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- create-storefront-order.use-case.ts
- presentation.module.ts
- Result
- types/index.ts
- react
- cn
- create-restaurant-account.use-case.ts
- WebhookEvent
- mongo-analytics.repository.ts
- UserRepository
- api.ts
- tracking/[code]/page.tsx
- delete-account.use-case.spec.ts
- store-claims.use-case.spec.ts
- persistence.module.ts
- .execute
- PushSubscription
- OperatingHours
- Coupon
- @nestjs/common
- api/package.json
- upload.controller.ts
- DeliveryAccessToken
- Restaurant
- material-icon.tsx
- onboarding.controller.ts
- RestaurantRepository
- delivery.controller.ts
- backfill-directory-data.use-case.spec.ts
- Quiero.Menu - Guia de Deploy
- menu/page.tsx
- app/page.tsx
- infrastructure.module.ts
- FeaturedSlotRepository
- KitchenAccessToken
- Public
- storefront-view.tsx
- mi-menu/page.tsx
- devDependencies
- [...geo]/page.tsx
- search-storefronts.use-case.ts
- auth.controller.ts
- .log
- RequestUser
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
- RefreshToken
- mongo-user.repository.ts
- CurrentUser
- admin.controller.ts
- ui/package.json
- tracking.controller.ts
- SocketIoGatewayService
- mongo-user-restaurant.repository.ts
- app/locales/page.tsx
- compilerOptions
- signup.use-case.ts
- ListActiveStorefrontsUseCase
- mongo-order-item.repository.ts
- menu.dto.ts
- mongo-order-feedback.repository.ts
- next
- dependencies
- main.ts
- Roles
- RestaurantCategory
- settings/page.tsx
- directory-search.tsx
- ApiClient
- scripts
- mongoose
- KitchenController
- assign-featured-slot.use-case.ts
- customers.controller.ts
- manifest.json
- store-card.tsx
- CouponController
- app/layout.tsx
- jest
- BillingController
- CustomDomainController
- Backup y restore de MongoDB
- Dominio personalizado para el storefront (quiero.menu)
- generate-icons.mjs
- api/README.md
- devDependencies
- cookie-consent.tsx
- .deleteAccount
- .changeStatus
- nest-cli.json
- [Unreleased]
- Email entrante en quiero.menu (SES inbound)
- app.e2e-spec.ts
- logout.use-case.ts
- custom-domain-worker.sh
- scripts
- RolesGuard
- tsconfig.build.json
- ui/README.md
- data/page.tsx
- MenuItemType
- RestaurantStatus
- UserRole
- SearchTerm
- backup-mongo.sh
- sw.js
- hydrate-env.sh
- user-data.sh
- AGENTS.md
- ui/eslint.config.mjs
- postcss.config.mjs
- gtag.d.ts

## God Nodes (most connected - your core abstractions)
1. `Result` - 131 edges
2. `ok()` - 129 edges
3. `cn()` - 124 edges
4. `err()` - 120 edges
5. `RestaurantRepository` - 101 edges
6. `@nestjs/common` - 84 edges
7. `react` - 77 edges
8. `RequestUser` - 76 edges
9. `CurrentUser` - 76 edges
10. `Restaurant` - 72 edges

## Surprising Connections (you probably didn't know these)
- `makeApprove()` --calls--> `ApproveStoreClaimUseCase`  [EXTRACTED]
  api/src/application/use-cases/claims/store-claims.use-case.spec.ts → api/src/application/use-cases/claims/approve-store-claim.use-case.ts
- `makeRestaurant()` --calls--> `Restaurant`  [EXTRACTED]
  api/src/application/use-cases/featured/assign-featured-slot.use-case.spec.ts → api/src/domain/entities/restaurant.entity.ts
- `AssignFeaturedSlotInput` --references--> `FeaturedScope`  [EXTRACTED]
  api/src/application/use-cases/featured/assign-featured-slot.use-case.ts → api/src/domain/entities/featured-slot.entity.ts
- `makeRestaurant()` --calls--> `Restaurant`  [EXTRACTED]
  api/src/application/use-cases/restaurant/backfill-directory-data.use-case.spec.ts → api/src/domain/entities/restaurant.entity.ts
- `makeItem()` --calls--> `MenuItem`  [EXTRACTED]
  api/src/application/use-cases/restaurant/backfill-directory-data.use-case.spec.ts → api/src/domain/entities/menu-item.entity.ts

## Import Cycles
- None detected.

## Communities (130 total, 13 thin omitted)

### Community 0 - "create-storefront-order.use-case.ts"
Cohesion: 0.04
Nodes (71): generateTrackingToken(), normalizeTrackingToken(), PushServicePort, RealtimeGatewayPort, ListCustomerOrdersUseCase, ListCustomersInput, ListCustomersUseCase, ConfirmDeliveryInput (+63 more)

### Community 1 - "presentation.module.ts"
Cohesion: 0.05
Nodes (41): GetAccountDataUseCase, AdminRestaurantDetailOutput, GetRestaurantDetailUseCase, CreateMenuCategoryUseCase, CreateMenuItemOptionUseCase, CreateMenuItemUseCase, CreateMenuItemVariantUseCase, DeleteMenuCategoryUseCase (+33 more)

### Community 2 - "Result"
Cohesion: 0.05
Nodes (38): computeCouponDiscount(), isCouponApplicable(), err(), ok(), Result, RecordStorefrontEventUseCase, localDateString(), RecordStorefrontViewUseCase (+30 more)

### Community 3 - "types/index.ts"
Cohesion: 0.04
Nodes (100): zustand, AdminActivityPage(), EVENT_ICONS, AdminDestacadosPage(), FeaturedSlotItem, AdminLocalesPage(), AnalyticsPage(), CustomersPage() (+92 more)

### Community 4 - "react"
Cohesion: 0.08
Nodes (47): react, sonner, AdminNuevoLocalPage(), deriveSlug(), generatePassword(), ClaimCard(), STATUS_TABS, STAGE_LABELS (+39 more)

### Community 5 - "cn"
Cohesion: 0.04
Nodes (58): Bar(), CommissionCalculator(), RATES, LandingNav(), LINKS, ALL_PRODUCTS, CATEGORIES, MenuDemo() (+50 more)

### Community 6 - "create-restaurant-account.use-case.ts"
Cohesion: 0.06
Nodes (46): CreateCheckoutParams, CreateCheckoutResult, PaymentProviderPort, WebhookEventType, WebhookSignatureContext, CreateRestaurantAccountInput, CreateRestaurantAccountOutput, CancelSubscriptionUseCase (+38 more)

### Community 7 - "WebhookEvent"
Cohesion: 0.06
Nodes (28): WebhookEvent, GetBillingHistoryUseCase, HandlePaymentWebhookUseCase, BillingRecord, BillingEventType, PAYMENT_FAILED, PAYMENT_SUCCESS, PLAN_CHANGED (+20 more)

### Community 8 - "mongo-analytics.repository.ts"
Cohesion: 0.05
Nodes (33): AnalyticsOverview, AnalyticsRange, GetAnalyticsOverviewUseCase, startOfZonedDay(), zonedOffsetMs(), StorefrontEvent, StorefrontEventType, INSTAGRAM (+25 more)

### Community 9 - "UserRepository"
Cohesion: 0.08
Nodes (23): EmailMessage, EmailServicePort, PasswordHasherPort, CreateRestaurantAccountUseCase, buildUseCase(), ForgotPasswordUseCase, buildUseCase(), ResendVerificationUseCase (+15 more)

### Community 10 - "api.ts"
Cohesion: 0.07
Nodes (36): AdminNavItem(), AdminUserMenu(), NAV_ITEMS, LoginForm(), OnboardingFlow(), deriveSlug(), SignupForm(), AdminGate() (+28 more)

### Community 11 - "tracking/[code]/page.tsx"
Cohesion: 0.08
Nodes (45): socket.io-client, AdminLocalDetailPage(), OrdersPage(), StorefrontPage(), ClaimPage(), dynamic, generateMetadata(), STATUS_ICONS (+37 more)

### Community 12 - "delete-account.use-case.spec.ts"
Cohesion: 0.13
Nodes (25): LoginInput, TokenProviderPort, DeleteAccountUseCase, buildUseCase(), ImpersonateRestaurantOwnerUseCase, ImpersonationOutput, buildUseCase(), AdminRestaurantListItem (+17 more)

### Community 13 - "store-claims.use-case.spec.ts"
Cohesion: 0.07
Nodes (24): StoreClaimListItem, deps(), makeApprove(), makeClaim(), makeRestaurant(), ListActiveCustomDomainsUseCase, ListPendingCustomDomainsUseCase, StoreClaim (+16 more)

### Community 14 - "persistence.module.ts"
Cohesion: 0.06
Nodes (37): MongoStorefrontEventRepository, Injectable, InjectModel, MongoStorefrontViewRepository, Injectable, InjectModel, AuditLogModel, AuditLogSchema (+29 more)

### Community 15 - ".execute"
Cohesion: 0.07
Nodes (8): isPlatformAdminEmail(), LoginOutput, GetCurrentUserUseCase, ListStoreClaimsUseCase, NotifyReceiptUploadedUseCase, EmailAlreadyExistsError, InvalidCredentialsError, SlugAlreadyExistsError

### Community 16 - "PushSubscription"
Cohesion: 0.08
Nodes (18): PushPayload, PushSubscription, PushSubscriptionKeys, CreatePushSubscriptionData, PushSubscriptionRepository, PushSubscriptionMapper, MongoPushSubscriptionRepository, Injectable (+10 more)

### Community 17 - "OperatingHours"
Cohesion: 0.07
Nodes (25): makeHours(), RestaurantOperatingHoursData, buildUseCase(), makeHours(), makeRestaurant(), UpdateOpenStatusUseCase, UpdateOperatingHoursUseCase, OperatingHours (+17 more)

### Community 18 - "Coupon"
Cohesion: 0.09
Nodes (24): CouponDiscountResult, makeCoupon(), CreateCouponInput, ListCouponsUseCase, ValidateCouponOutput, Coupon, CouponType, FIXED (+16 more)

### Community 19 - "@nestjs/common"
Cohesion: 0.09
Nodes (22): MercadoPagoWebhookBody, RequestWithRawBody, IS_PUBLIC_KEY, ROLES_KEY, InternalTokenGuard, Injectable, ZodValidationPipe, DeleteAccountRequestDto (+14 more)

### Community 20 - "api/package.json"
Cohesion: 0.05
Nodes (39): author, description, eslint, @types/node, typescript, license, name, private (+31 more)

### Community 21 - "upload.controller.ts"
Cohesion: 0.08
Nodes (23): ImageType, PresignedUrlRequest, PresignedUrlResponse, StoragePort, StoredObject, ALLOWED_CONTENT_TYPES, ALLOWED_IMAGE_TYPES, GenerateUploadUrlUseCase (+15 more)

### Community 22 - "DeliveryAccessToken"
Cohesion: 0.10
Nodes (12): generateCode(), DeliveryAccessToken, DeliveryAccessTokenRepository, DeliveryAccessTokenMapper, MongoDeliveryAccessTokenRepository, Injectable, InjectModel, DeliveryAccessTokenDocument (+4 more)

### Community 23 - "Restaurant"
Cohesion: 0.11
Nodes (19): CustomDomainInfo, makeRestaurant(), makeRestaurant(), CustomDomainStatus, Restaurant, StorefrontTheme, RestaurantStatus, ACTIVE (+11 more)

### Community 24 - "material-icon.tsx"
Cohesion: 0.10
Nodes (25): AccountPage(), metadata, CouponsPage(), AdminSidebar(), MobileBottomNav(), MobileUserMenu(), MOBILE_PRIMARY, NAV_SECTIONS (+17 more)

### Community 25 - "onboarding.controller.ts"
Cohesion: 0.08
Nodes (23): MenuVisionCategory, MenuVisionInput, MenuVisionItem, MenuVisionOutput, MenuVisionPort, AnalyzeMenuUseCase, AiModule, Module (+15 more)

### Community 26 - "RestaurantRepository"
Cohesion: 0.09
Nodes (15): CreateUnclaimedRestaurantUseCase, ActiveCustomDomain, PendingCustomDomain, SetCustomDomainUseCase, buildUseCase(), makeRestaurant(), CustomDomainAlreadyInUseError, CustomDomainInvalidError (+7 more)

### Community 27 - "delivery.controller.ts"
Cohesion: 0.11
Nodes (18): CreateDeliveryTokenUseCase, ListDeliveryTokensUseCase, RevokeDeliveryTokenUseCase, ValidateDeliveryTokenUseCase, CreateKitchenTokenUseCase, ListKitchenTokensUseCase, RevokeKitchenTokenUseCase, ValidateKitchenTokenUseCase (+10 more)

### Community 28 - "backfill-directory-data.use-case.spec.ts"
Cohesion: 0.09
Nodes (15): makeItem(), makeRestaurant(), MenuItemType, COMBO, SIMPLE, VARIANT, MenuItemMapper, MongoMenuItemRepository (+7 more)

### Community 29 - "Quiero.Menu - Guia de Deploy"
Cohesion: 0.06
Nodes (33): Checklist post-deploy:, CloudFront / imagenes no cargan, Comandos utiles en el servidor:, Configurar credenciales AWS, El sitio no carga, Emails configurados, Emails no llegan, Estructura de archivos en el servidor (+25 more)

### Community 30 - "menu/page.tsx"
Cohesion: 0.09
Nodes (27): CatDialog, ItemDialog, MenuPage(), OptionDialog, RichCategory, RichItem, VariantDialog, AccessManagerDialog() (+19 more)

### Community 31 - "app/page.tsx"
Cohesion: 0.06
Nodes (19): BENTO_FEATURES, faqJsonLd, faqs, getLiveStores(), LandingPage(), LIVE_STORES, MARQUEE_ITEMS, metadata (+11 more)

### Community 32 - "infrastructure.module.ts"
Cohesion: 0.09
Nodes (21): TokenPayload, AuthInfraModule, Module, JwtTokenService, Injectable, EmailModule, Module, InfrastructureModule (+13 more)

### Community 33 - "FeaturedSlotRepository"
Cohesion: 0.12
Nodes (12): FeaturedSlotListItem, ListFeaturedSlotsUseCase, FeaturedSlotRef, FeaturedScope, FeaturedSlot, CreateFeaturedSlotData, FeaturedSlotRepository, MongoFeaturedSlotRepository (+4 more)

### Community 34 - "KitchenAccessToken"
Cohesion: 0.10
Nodes (14): generateCode(), KitchenAccessToken, KitchenAccessTokenMapper, MongoKitchenAccessTokenRepository, Injectable, InjectModel, KitchenAccessTokenDocument, KitchenAccessTokenModel (+6 more)

### Community 35 - "Public"
Cohesion: 0.12
Nodes (18): HealthController, Controller, Get, Inject, StorefrontController, Body, Controller, Get (+10 more)

### Community 36 - "storefront-view.tsx"
Cohesion: 0.11
Nodes (22): Check, CHECKS, VerifyState, FullMenuItem, StorefrontView(), useMediaQuery(), Logo(), LogoProps (+14 more)

### Community 37 - "mi-menu/page.tsx"
Cohesion: 0.10
Nodes (23): qrcode.react, Draft, MiMenuPageInner(), MiMenuTab, PRESET_COLORS, TABS, hoursLabel(), ImprimirPage() (+15 more)

### Community 38 - "devDependencies"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+20 more)

### Community 39 - "[...geo]/page.tsx"
Cohesion: 0.19
Nodes (24): breadcrumbsForCity(), CategoryView(), CityView(), CountryHub(), dynamic, generateMetadata(), GeoDirectoryPage(), groupByCity() (+16 more)

### Community 40 - "search-storefronts.use-case.ts"
Cohesion: 0.13
Nodes (18): ListSearchTermsUseCase, ActiveStorefrontSummary, matches(), normalize(), searchable(), SearchStorefrontsUseCase, makeItem(), makeRestaurant() (+10 more)

### Community 41 - "auth.controller.ts"
Cohesion: 0.19
Nodes (17): AuthController, Body, Controller, Post, Throttle, ForgotPasswordRequestDto, ForgotPasswordRequestSchema, LoginRequestDto (+9 more)

### Community 42 - ".log"
Cohesion: 0.17
Nodes (9): AdminController, Body, Controller, Get, Param, Post, Query, Throttle (+1 more)

### Community 43 - "RequestUser"
Cohesion: 0.22
Nodes (10): MenuController, Body, Controller, Delete, Get, Param, Patch, Post (+2 more)

### Community 44 - "backfill-directory-data.use-case.ts"
Cohesion: 0.14
Nodes (15): CITY_GEO, DerivedGeo, deriveGeoFromCity(), COUNTRY_SLUG_BY_CODE, countrySlugFrom(), slugifyCity(), BackfillDirectoryDataUseCase, BackfillDirectoryResult (+7 more)

### Community 45 - "mongo-verification-token.repository.ts"
Cohesion: 0.15
Nodes (12): TokenType, VerificationToken, CreateVerificationTokenData, VerificationTokenMapper, MongoVerificationTokenRepository, Injectable, InjectModel, Prop (+4 more)

### Community 46 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, @aws-sdk/client-s3, @aws-sdk/client-ses, @aws-sdk/s3-request-presigner, bcrypt, helmet, mongoose, @nestjs/common (+16 more)

### Community 47 - "push.controller.ts"
Cohesion: 0.13
Nodes (13): PushController, Body, Controller, Delete, Get, Post, PushSubscriptionSchema, SubscribeOrderRequestDto (+5 more)

### Community 48 - "mongo-audit-log.repository.ts"
Cohesion: 0.16
Nodes (11): AdminAuditLogItem, ListAuditLogsUseCase, buildUseCase(), AuditLogEntry, CreateAuditLogEntryData, AuditLogRepository, MongoAuditLogRepository, Injectable (+3 more)

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

### Community 54 - "RefreshToken"
Cohesion: 0.17
Nodes (10): RefreshToken, RefreshTokenMapper, MongoRefreshTokenRepository, Injectable, InjectModel, RefreshTokenDocument, RefreshTokenModel, RefreshTokenSchema (+2 more)

### Community 55 - "mongo-user.repository.ts"
Cohesion: 0.16
Nodes (9): UserMapper, MongoUserRepository, Injectable, InjectModel, Prop, Schema, UserDocument, UserModel (+1 more)

### Community 56 - "CurrentUser"
Cohesion: 0.19
Nodes (13): Get, RestaurantController, Body, Controller, Get, Patch, CurrentUser, UpdateOpenStatusRequestDto (+5 more)

### Community 57 - "admin.controller.ts"
Cohesion: 0.18
Nodes (16): AdminGuard, Injectable, AdminApproveClaimRequestDto, AdminApproveClaimRequestSchema, AdminAssignFeaturedRequestDto, AdminAssignFeaturedRequestSchema, AdminAuditLogsRequestDto, AdminAuditLogsRequestSchema (+8 more)

### Community 58 - "ui/package.json"
Cohesion: 0.10
Nodes (19): @base-ui/react, browser-image-compression, clsx, eslint-config-next, next-themes, react-dom, shadcn, tailwind-merge (+11 more)

### Community 59 - "tracking.controller.ts"
Cohesion: 0.13
Nodes (12): TrackingController, Body, Controller, Get, Param, Post, Throttle, PresentationModule (+4 more)

### Community 60 - "SocketIoGatewayService"
Cohesion: 0.11
Nodes (10): SocketIoGatewayService, Inject, Injectable, JwtAuthGuard, Inject, Injectable, @nestjs/websockets, socket.io (+2 more)

### Community 61 - "mongo-user-restaurant.repository.ts"
Cohesion: 0.16
Nodes (9): UserRestaurantMapper, MongoUserRestaurantRepository, Injectable, InjectModel, Prop, Schema, UserRestaurantDocument, UserRestaurantModel (+1 more)

### Community 62 - "app/locales/page.tsx"
Cohesion: 0.18
Nodes (14): baseMetadata, CitySection, dynamic, groupByCity(), LocalesPage(), BreadcrumbsJsonLd(), DirectoryJsonLd(), Item (+6 more)

### Community 63 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 64 - "signup.use-case.ts"
Cohesion: 0.22
Nodes (8): SignupInput, SignupUseCase, baseLayout(), claimApprovedTemplate(), passwordResetTemplate(), receiptUploadedTemplate(), verifyEmailTemplate(), welcomeTemplate()

### Community 65 - "ListActiveStorefrontsUseCase"
Cohesion: 0.16
Nodes (7): ListActiveStorefrontsUseCase, StorefrontsIndexController, Controller, Get, Inject, Query, Throttle

### Community 66 - "mongo-order-item.repository.ts"
Cohesion: 0.16
Nodes (9): OrderItemMapper, MongoOrderItemRepository, Injectable, InjectModel, OrderItemDocument, OrderItemModel, OrderItemSchema, Prop (+1 more)

### Community 67 - "menu.dto.ts"
Cohesion: 0.11
Nodes (17): CreateCategoryRequestDto, CreateCategoryRequestSchema, CreateItemRequestDto, CreateItemRequestSchema, CreateOptionRequestDto, CreateOptionRequestSchema, CreateVariantRequestDto, CreateVariantRequestSchema (+9 more)

### Community 68 - "mongo-order-feedback.repository.ts"
Cohesion: 0.18
Nodes (10): OrderFeedback, MongoOrderFeedbackRepository, toDomain(), Injectable, InjectModel, OrderFeedbackDocument, OrderFeedbackModel, OrderFeedbackSchema (+2 more)

### Community 69 - "next"
Cohesion: 0.12
Nodes (8): next, nextConfig, metadata, APP_ROUTES, dynamic, generateMetadata(), metadata, getStorefrontIndex()

### Community 70 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @base-ui/react, browser-image-compression, class-variance-authority, clsx, next, next-themes, qrcode.react (+9 more)

### Community 71 - "main.ts"
Cohesion: 0.17
Nodes (10): LOG_LEVELS, parseLogLevels(), StructuredLogger, Injectable, bootstrap(), GlobalExceptionFilter, Catch, helmet (+2 more)

### Community 72 - "Roles"
Cohesion: 0.23
Nodes (9): DeliveryController, Body, Controller, Delete, Get, Param, Post, Req (+1 more)

### Community 74 - "RestaurantCategory"
Cohesion: 0.14
Nodes (14): CreateUnclaimedRestaurantInput, RESTAURANT_CATEGORIES, RestaurantCategoryDef, RestaurantCategory, BAR, CAFE, EMPANADERIA, HAMBURGUESERIA (+6 more)

### Community 75 - "settings/page.tsx"
Cohesion: 0.18
Nodes (11): class-variance-authority, LEGACY_TAB_REDIRECTS, SETTINGS_TABS, SettingsTab, PaymentMethodsSettings(), RestaurantDataSettings(), Tabs(), TabsContent() (+3 more)

### Community 76 - "directory-search.tsx"
Cohesion: 0.24
Nodes (13): DirectoryCityOption, DirectorySearch(), SUGGESTION_LABELS, slugifyCity(), CATEGORY_TEXT, fetchStorefrontIndex(), filterIndexLocally(), normalize() (+5 more)

### Community 78 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, backfill:tracking-tokens, build, format, lint, start, start:debug, start:dev (+6 more)

### Community 79 - "mongoose"
Cohesion: 0.19
Nodes (9): MongoSearchTermRepository, Injectable, InjectModel, SearchTermDocument, SearchTermModel, SearchTermSchema, Prop, Schema (+1 more)

### Community 80 - "KitchenController"
Cohesion: 0.23
Nodes (8): KitchenController, Body, Controller, Delete, Get, Param, Post, Req

### Community 81 - "assign-featured-slot.use-case.ts"
Cohesion: 0.22
Nodes (8): AssignFeaturedSlotInput, AssignFeaturedSlotUseCase, MAX_CATEGORY_SLOTS, MAX_HOME_SLOTS, deps(), makeRestaurant(), FeaturedSlotFullError, RestaurantNotFeatureableError

### Community 82 - "customers.controller.ts"
Cohesion: 0.26
Nodes (9): CustomerController, Controller, Get, Param, Query, ListCustomerOrdersQueryDto, ListCustomerOrdersQuerySchema, ListCustomersQueryDto (+1 more)

### Community 83 - "manifest.json"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, id, name, orientation (+4 more)

### Community 84 - "store-card.tsx"
Cohesion: 0.28
Nodes (10): StoreCard(), waDigits(), isValidTime(), omitEmpty(), priceRange(), SCHEMA_DAY_NAMES, StorefrontJsonLd(), formatUpdatedDate() (+2 more)

### Community 85 - "CouponController"
Cohesion: 0.20
Nodes (8): CouponController, Body, Controller, Delete, Get, Param, Patch, Post

### Community 86 - "app/layout.tsx"
Cohesion: 0.20
Nodes (8): @sentry/nextjs, inter, metadata, plusJakartaSans, poppins, RegisterSW(), SentryInit(), Toaster()

### Community 87 - "jest"
Cohesion: 0.18
Nodes (11): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, moduleNameMapper, rootDir, testEnvironment, testRegex (+3 more)

### Community 88 - "BillingController"
Cohesion: 0.25
Nodes (4): BillingController, Controller, Get, Post

### Community 89 - "CustomDomainController"
Cohesion: 0.18
Nodes (7): CustomDomainController, Body, Controller, Delete, Get, Inject, Put

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

### Community 96 - ".deleteAccount"
Cohesion: 0.22
Nodes (6): AccountController, Body, Controller, Delete, Get, Inject

### Community 97 - ".changeStatus"
Cohesion: 0.22
Nodes (6): Body, Get, Param, Patch, Query, UpdateOrderStatusRequestDto

### Community 98 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 99 - "[Unreleased]"
Cohesion: 0.33
Nodes (5): Added, Changed, Changelog, Fixed, [Unreleased]

### Community 100 - "Email entrante en quiero.menu (SES inbound)"
Cohesion: 0.33
Nodes (5): Agregar una casilla, Cómo funciona (`infra/terraform/email-inbound.tf`), Email entrante en quiero.menu (SES inbound), Por qué no un Lambda, Verificar que funciona

### Community 101 - "app.e2e-spec.ts"
Cohesion: 0.40
Nodes (4): AppModule, Module, @nestjs/testing, supertest

### Community 103 - "custom-domain-worker.sh"
Cohesion: 0.80
Nodes (4): mark_status(), provision(), reload_nginx(), custom-domain-worker.sh script

### Community 104 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

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

## Knowledge Gaps
- **561 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+556 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1020 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `@nestjs/common` to `create-storefront-order.use-case.ts`, `presentation.module.ts`, `Result`, `create-restaurant-account.use-case.ts`, `WebhookEvent`, `mongo-analytics.repository.ts`, `UserRepository`, `store-claims.use-case.spec.ts`, `persistence.module.ts`, `PushSubscription`, `OperatingHours`, `Coupon`, `api/package.json`, `upload.controller.ts`, `DeliveryAccessToken`, `Restaurant`, `onboarding.controller.ts`, `delivery.controller.ts`, `backfill-directory-data.use-case.spec.ts`, `infrastructure.module.ts`, `FeaturedSlotRepository`, `KitchenAccessToken`, `Public`, `auth.controller.ts`, `backfill-directory-data.use-case.ts`, `mongo-verification-token.repository.ts`, `push.controller.ts`, `mongo-audit-log.repository.ts`, `mongo-menu-item-option.repository.ts`, `mongo-menu-category.repository.ts`, `mongo-menu-item-variant.repository.ts`, `RefreshToken`, `mongo-user.repository.ts`, `CurrentUser`, `admin.controller.ts`, `tracking.controller.ts`, `SocketIoGatewayService`, `mongo-user-restaurant.repository.ts`, `mongo-order-item.repository.ts`, `mongo-order-feedback.repository.ts`, `main.ts`, `mongoose`, `customers.controller.ts`, `app.e2e-spec.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `api/package.json`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `RestaurantRepository` connect `RestaurantRepository` to `create-storefront-order.use-case.ts`, `presentation.module.ts`, `Result`, `create-restaurant-account.use-case.ts`, `mongo-analytics.repository.ts`, `UserRepository`, `delete-account.use-case.spec.ts`, `store-claims.use-case.spec.ts`, `.execute`, `OperatingHours`, `Restaurant`, `backfill-directory-data.use-case.spec.ts`, `FeaturedSlotRepository`, `search-storefronts.use-case.ts`, `backfill-directory-data.use-case.ts`, `signup.use-case.ts`, `ListActiveStorefrontsUseCase`, `.deleteRestaurant`, `assign-featured-slot.use-case.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _561 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `create-storefront-order.use-case.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.035093167701863354 - nodes in this community are weakly interconnected._
- **Should `presentation.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04614818900533186 - nodes in this community are weakly interconnected._
- **Should `Result` be split into smaller, more focused modules?**
  _Cohesion score 0.05419319875355643 - nodes in this community are weakly interconnected._