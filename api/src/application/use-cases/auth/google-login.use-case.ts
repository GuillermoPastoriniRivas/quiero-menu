import { randomBytes } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { LoginOutput } from '../../dtos/auth/login-output.dto.js';
import { Result, ok, err } from '../../common/result.js';
import { isPlatformAdminEmail } from '../../common/platform-admin.js';
import { issueSession } from '../../common/session-tokens.js';
import { GoogleIdentityVerifier } from '../../common/google-identity.js';
import { slugifyCity } from '../../common/slugify.js';
import { deriveGeoFromCity } from '../../common/geo.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';
import { SlugAlreadyExistsError } from '../../../domain/errors/domain-errors.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { RestaurantCategory } from '../../../domain/enums/restaurant-category.enum.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import {
  DEFAULT_RESTAURANT_COUNTRY,
  DEFAULT_RESTAURANT_CURRENCY,
  DEFAULT_RESTAURANT_TIMEZONE,
} from '../../../domain/constants/restaurant-defaults.js';

export interface GoogleSignupRestaurantInput {
  name?: string;
  city?: string;
  category?: RestaurantCategory;
}

export class GoogleLoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly tokenProvider: TokenProviderPort,
    private readonly platformAdminEmails: string[],
    private readonly googleVerifier: GoogleIdentityVerifier,
  ) {}

  async execute(input: {
    credential: string;
    restaurant?: GoogleSignupRestaurantInput;
  }): Promise<Result<LoginOutput, Error>> {
    const identity = await this.googleVerifier.verify(input.credential);
    if (!identity) return err(new InvalidCredentialsError());

    let user = await this.userRepo.findByEmail(identity.email);
    let restaurantId: string;
    let restaurantSlug: string;
    let role: UserRole;

    if (user) {
      const userRestaurants = await this.userRestaurantRepo.findByUserId(
        user.id,
      );
      if (userRestaurants.length === 0) {
        return err(new InvalidCredentialsError());
      }
      restaurantId = userRestaurants[0].restaurantId;
      role = userRestaurants[0].role;
      const restaurant = await this.restaurantRepo.findById(restaurantId);
      restaurantSlug = restaurant?.slug ?? '';
    } else {
      const created = await this.createOwnedRestaurant(
        identity.email,
        input.restaurant,
      );
      if (!created.ok) return err(created.error);

      user = await this.userRepo.create({
        name: identity.name,
        email: identity.email,
        passwordHash: '',
        emailVerified: true,
      });

      await this.userRestaurantRepo.create({
        userId: user.id,
        restaurantId: created.value.id,
        role: UserRole.OWNER,
      });

      restaurantId = created.value.id;
      restaurantSlug = created.value.slug;
      role = UserRole.OWNER;
    }

    const platformAdmin = isPlatformAdminEmail(
      identity.email,
      this.platformAdminEmails,
    );

    const session = await issueSession(
      this.tokenProvider,
      this.refreshTokenRepo,
      {
        sub: user.id,
        restaurantId,
        role,
        ...(platformAdmin ? { plat: true } : {}),
      },
    );

    return ok({
      ...session,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        restaurantId,
        restaurantSlug,
        ...(platformAdmin ? { platformAdmin: true } : {}),
      },
    });
  }

  private async createOwnedRestaurant(
    email: string,
    data: GoogleSignupRestaurantInput | undefined,
  ): Promise<Result<{ id: string; slug: string }, SlugAlreadyExistsError>> {
    const name = data?.name?.trim() || 'Mi local';
    const city = data?.city?.trim() ?? '';
    const slug = await this.findFreeSlug(
      slugifyCity(data?.name ?? '') ||
        slugifyCity(email.split('@')[0]) ||
        'mi-menu',
    );
    if (!slug) return err(new SlugAlreadyExistsError());

    const restaurant = await this.restaurantRepo.create({
      slug,
      name,
      description: '',
      logoUrl: '',
      bannerUrl: '',
      address: '',
      city,
      ...(city
        ? {
            citySlug: slugifyCity(city),
            ...deriveGeoFromCity(city, DEFAULT_RESTAURANT_COUNTRY),
          }
        : {}),
      ...(data?.category ? { category: data.category } : {}),
      country: DEFAULT_RESTAURANT_COUNTRY,
      coordinates: null,
      phone: '',
      timezone: DEFAULT_RESTAURANT_TIMEZONE,
      currency: DEFAULT_RESTAURANT_CURRENCY,
      status: RestaurantStatus.ACTIVE,
      openOverride: null,
      customDomain: null,
      customDomainStatus: null,
      socialLinks: null,
      paymentMethods: {
        cashEnabled: true,
        cardEnabled: true,
        transferEnabled: true,
      },
      theme: { primaryColor: '#E8532C' },
    });

    await this.subscriptionRepo.create({
      restaurantId: restaurant.id,
      plan: PlanTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      canceledAt: null,
      paymentProvider: PaymentProvider.NONE,
      externalCustomerId: null,
      externalSubscriptionId: null,
    });

    return ok({ id: restaurant.id, slug: restaurant.slug });
  }

  private async findFreeSlug(base: string): Promise<string | null> {
    let slug = base;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!(await this.restaurantRepo.findBySlug(slug))) return slug;
      slug = `${base}-${randomBytes(2).toString('hex')}`;
    }
    return null;
  }
}
