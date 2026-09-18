import { createHash, randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { LoginOutput } from '../../dtos/auth/login-output.dto.js';
import { Result, ok, err } from '../../common/result.js';
import { isPlatformAdminEmail } from '../../common/platform-admin.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';
import { SlugAlreadyExistsError } from '../../../domain/errors/domain-errors.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';

export class GoogleLoginUseCase {
  private readonly client: OAuth2Client;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly tokenProvider: TokenProviderPort,
    private readonly platformAdminEmails: string[],
    private readonly googleClientId: string,
  ) {
    this.client = new OAuth2Client(this.googleClientId);
  }

  async execute(input: {
    credential: string;
  }): Promise<Result<LoginOutput, Error>> {
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: input.credential,
        audience: this.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      return err(new InvalidCredentialsError());
    }

    if (!payload || !payload.email || !payload.email_verified) {
      return err(new InvalidCredentialsError());
    }

    const email = payload.email;
    const displayName = payload.name ?? email.split('@')[0];

    let user = await this.userRepo.findByEmail(email);
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
      const baseSlug =
        email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'mi-menu';
      let slug = baseSlug;
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await this.restaurantRepo.findBySlug(slug);
        if (!existing) break;
        slug = `${baseSlug}-${randomBytes(2).toString('hex')}`;
      }
      const finalSlug = slug || baseSlug;
      const created = await this.restaurantRepo.findBySlug(finalSlug);
      if (created) return err(new SlugAlreadyExistsError());

      user = await this.userRepo.create({
        name: displayName,
        email,
        passwordHash: '',
        emailVerified: true,
      });

      const restaurant = await this.restaurantRepo.create({
        slug: finalSlug,
        name: 'Mi local',
        description: '',
        logoUrl: '',
        bannerUrl: '',
        address: '',
        city: '',
        country: '',
        coordinates: null,
        phone: '',
        timezone: 'America/Bogota',
        currency: 'COP',
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

      await this.userRestaurantRepo.create({
        userId: user.id,
        restaurantId: restaurant.id,
        role: UserRole.OWNER,
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

      restaurantId = restaurant.id;
      restaurantSlug = restaurant.slug;
      role = UserRole.OWNER;
    }

    const platformAdmin = isPlatformAdminEmail(email, this.platformAdminEmails);

    const tokenPayload = {
      sub: user.id,
      restaurantId,
      role,
      ...(platformAdmin ? { plat: true } : {}),
    };
    const accessToken = this.tokenProvider.signAccess(tokenPayload);
    const refreshToken = this.tokenProvider.signRefresh(tokenPayload);

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return ok({
      accessToken,
      refreshToken,
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
}
