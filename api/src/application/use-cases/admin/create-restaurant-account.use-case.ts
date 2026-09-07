import { createHash, randomBytes } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import type { EmailServicePort } from '../../ports/email-service.port.js';
import { Result, ok, err } from '../../common/result.js';
import {
  EmailAlreadyExistsError,
  SlugAlreadyExistsError,
} from '../../../domain/errors/domain-errors.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import { welcomeTemplate } from '../../../infrastructure/email/templates/welcome.template.js';
import { verifyEmailTemplate } from '../../../infrastructure/email/templates/verify-email.template.js';
import { RestaurantCategory } from '../../../domain/enums/restaurant-category.enum.js';
import { slugifyCity } from '../../common/slugify.js';

export interface CreateRestaurantAccountInput {
  ownerName: string;
  email: string;
  password: string;
  restaurantName: string;
  restaurantSlug: string;
  city?: string;
  category?: string;
  currency?: string;
  timezone?: string;
  sendOwnerEmails?: boolean;
}

export interface CreateRestaurantAccountOutput {
  userId: string;
  restaurantId: string;
  slug: string;
}

export class CreateRestaurantAccountUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly verificationTokenRepo: VerificationTokenRepository,
    private readonly emailService: EmailServicePort,
    private readonly frontendUrl: string,
  ) {}

  async execute(
    input: CreateRestaurantAccountInput,
  ): Promise<
    Result<
      CreateRestaurantAccountOutput,
      EmailAlreadyExistsError | SlugAlreadyExistsError
    >
  > {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) return err(new EmailAlreadyExistsError());

    const existingSlug = await this.restaurantRepo.findBySlug(
      input.restaurantSlug,
    );
    if (existingSlug) return err(new SlugAlreadyExistsError());

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepo.create({
      name: input.ownerName,
      email: input.email,
      passwordHash,
      emailVerified: false,
    });

    const restaurant = await this.restaurantRepo.create({
      slug: input.restaurantSlug,
      name: input.restaurantName,
      description: '',
      logoUrl: '',
      bannerUrl: '',
      address: '',
      city: input.city ?? '',
      citySlug: slugifyCity(input.city ?? ''),
      category: (input.category as RestaurantCategory) ?? RestaurantCategory.NONE,
      country: 'AR',
      coordinates: null,
      phone: '',
      timezone: input.timezone ?? 'America/Argentina/Buenos_Aires',
      currency: input.currency ?? 'ARS',
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

    if (input.sendOwnerEmails !== false) {
      this.sendEmails(user.id, user.name, user.email, restaurant.name).catch(
        () => {},
      );
    }

    return ok({
      userId: user.id,
      restaurantId: restaurant.id,
      slug: restaurant.slug,
    });
  }

  private async sendEmails(
    userId: string,
    userName: string,
    email: string,
    restaurantName: string,
  ): Promise<void> {
    await this.emailService.send({
      to: email,
      subject: `Bienvenido a quiero-menu, ${userName}!`,
      html: welcomeTemplate(userName, restaurantName, this.frontendUrl),
    });

    const rawToken = randomBytes(32).toString('hex');
    const verificationHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.verificationTokenRepo.create({
      userId,
      tokenHash: verificationHash,
      type: 'email_verification',
      expiresAt: verifyExpiresAt,
    });

    const verifyUrl = `${this.frontendUrl}/verify-email?token=${rawToken}`;
    await this.emailService.send({
      to: email,
      subject: 'Verificá tu email — quiero-menu',
      html: verifyEmailTemplate(userName, verifyUrl),
    });
  }
}
