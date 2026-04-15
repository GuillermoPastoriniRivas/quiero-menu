import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { SignupInput } from '../../dtos/auth/signup-input.dto.js';
import { LoginOutput } from '../../dtos/auth/login-output.dto.js';
import { Result, ok, err } from '../../common/result.js';
import { EmailAlreadyExistsError, SlugAlreadyExistsError } from '../../../domain/errors/domain-errors.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';

export class SignupUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(input: SignupInput): Promise<Result<LoginOutput, EmailAlreadyExistsError | SlugAlreadyExistsError>> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) return err(new EmailAlreadyExistsError());

    const existingSlug = await this.restaurantRepo.findBySlug(input.restaurantSlug);
    if (existingSlug) return err(new SlugAlreadyExistsError());

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const restaurant = await this.restaurantRepo.create({
      slug: input.restaurantSlug,
      name: input.restaurantName,
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
      customDomain: null,
      socialLinks: null,
      paymentMethods: { cashEnabled: true, cardEnabled: true, transferEnabled: true },
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

    const payload = { sub: user.id, restaurantId: restaurant.id, role: UserRole.OWNER };
    const accessToken = this.tokenProvider.signAccess(payload);
    const refreshToken = this.tokenProvider.signRefresh(payload);

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

    return ok({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: UserRole.OWNER,
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
      },
    });
  }
}
