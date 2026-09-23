import { InvitationRepository } from '../../../domain/repositories/invitation.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { GoogleIdentityVerifier } from '../../common/google-identity.js';
import { Result, ok, err } from '../../common/result.js';
import { isPlatformAdminEmail } from '../../common/platform-admin.js';
import { issueSession } from '../../common/session-tokens.js';
import { User } from '../../../domain/entities/user.entity.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { UserRestaurant } from '../../../domain/entities/user-restaurant.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import {
  AccountHasRestaurantError,
  InvalidCredentialsError,
  InvitationEmailMismatchError,
  InvitationNotActiveError,
  InvitationNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import { hashInvitationToken } from './invitation-token.js';

export type AcceptInvitationCredentials =
  | { kind: 'google'; credential: string }
  | { kind: 'password'; name: string; email: string; password: string };

export type AcceptInvitationError =
  | InvitationNotFoundError
  | InvitationNotActiveError
  | InvitationEmailMismatchError
  | InvalidCredentialsError
  | AccountHasRestaurantError;

export interface AcceptInvitationOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    restaurantId: string;
    restaurantSlug: string;
    restaurantName: string;
    platformAdmin?: boolean;
  };
}

interface ResolvedIdentity {
  email: string;
  name: string;
  existing: User | null;
  passwordHash: string;
  emailVerified: boolean;
}

export class AcceptInvitationUseCase {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly orderRepo: OrderRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenProvider: TokenProviderPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly googleVerifier: GoogleIdentityVerifier,
    private readonly platformAdminEmails: string[],
  ) {}

  async execute(
    rawToken: string,
    credentials: AcceptInvitationCredentials,
  ): Promise<Result<AcceptInvitationOutput, AcceptInvitationError>> {
    const invitation = await this.invitationRepo.findByTokenHash(
      hashInvitationToken(rawToken),
    );
    if (!invitation) return err(new InvitationNotFoundError());

    const status = invitation.statusAt(new Date());
    if (status !== 'active') return err(new InvitationNotActiveError(status));

    const restaurant = await this.restaurantRepo.findById(
      invitation.restaurantId,
    );
    if (!restaurant) return err(new InvitationNotFoundError());

    const identity = await this.resolveIdentity(credentials);
    if (!identity.ok) return identity;

    if (
      invitation.email &&
      invitation.email.toLowerCase() !== identity.value.email.toLowerCase()
    ) {
      return err(new InvitationEmailMismatchError());
    }

    let user = identity.value.existing;
    const currentLinks = user
      ? await this.userRestaurantRepo.findByUserId(user.id)
      : [];
    const alreadyOwner = currentLinks.some(
      (l) => l.restaurantId === restaurant.id,
    );
    const otherLinks = currentLinks.filter(
      (l) => l.restaurantId !== restaurant.id,
    );

    if (!alreadyOwner && otherLinks.length > 0) {
      for (const link of otherLinks) {
        if (!(await this.isDisposablePlaceholder(link))) {
          return err(new AccountHasRestaurantError());
        }
      }
    }

    const accepted = await this.invitationRepo.markAccepted(
      invitation.id,
      user?.id ?? null,
    );
    if (!accepted) return err(new InvitationNotActiveError('accepted'));

    try {
      user = await this.takeOwnership(
        invitation.id,
        restaurant,
        user,
        identity.value,
        alreadyOwner,
        otherLinks,
      );
    } catch (error) {
      await this.invitationRepo.releaseAcceptance(invitation.id);
      throw error;
    }

    const platformAdmin = isPlatformAdminEmail(
      user.email,
      this.platformAdminEmails,
    );
    const session = await issueSession(
      this.tokenProvider,
      this.refreshTokenRepo,
      {
        sub: user.id,
        restaurantId: restaurant.id,
        role: UserRole.OWNER,
        ...(platformAdmin ? { plat: true } : {}),
      },
    );

    return ok({
      ...session,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: UserRole.OWNER,
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        restaurantName: restaurant.name,
        ...(platformAdmin ? { platformAdmin: true } : {}),
      },
    });
  }

  private async takeOwnership(
    invitationId: string,
    restaurant: Restaurant,
    existing: User | null,
    identity: ResolvedIdentity,
    alreadyOwner: boolean,
    otherLinks: UserRestaurant[],
  ): Promise<User> {
    let user = existing;
    if (!user) {
      user = await this.userRepo.create({
        name: identity.name,
        email: identity.email,
        passwordHash: identity.passwordHash,
        emailVerified: identity.emailVerified,
      });
      await this.invitationRepo.setAcceptedBy(invitationId, user.id);
    }

    if (!alreadyOwner) {
      for (const link of otherLinks) {
        await this.discardPlaceholder(link);
      }
      await this.userRestaurantRepo.create({
        userId: user.id,
        restaurantId: restaurant.id,
        role: UserRole.OWNER,
      });
    }

    if (restaurant.claimed !== true) {
      await this.restaurantRepo.update(restaurant.id, { claimed: true });
    }
    await this.ensureFreeSubscription(restaurant.id);
    return user;
  }

  private async resolveIdentity(
    credentials: AcceptInvitationCredentials,
  ): Promise<Result<ResolvedIdentity, InvalidCredentialsError>> {
    if (credentials.kind === 'google') {
      const google = await this.googleVerifier.verify(credentials.credential);
      if (!google) return err(new InvalidCredentialsError());
      return ok({
        email: google.email,
        name: google.name,
        existing: await this.userRepo.findByEmail(google.email),
        passwordHash: '',
        emailVerified: true,
      });
    }

    const email = credentials.email.trim();
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      const valid =
        existing.passwordHash !== '' &&
        (await this.passwordHasher.verify(
          credentials.password,
          existing.passwordHash,
        ));
      if (!valid) return err(new InvalidCredentialsError());
      return ok({
        email,
        name: existing.name,
        existing,
        passwordHash: existing.passwordHash,
        emailVerified: existing.emailVerified,
      });
    }

    return ok({
      email,
      name: credentials.name.trim(),
      existing: null,
      passwordHash: await this.passwordHasher.hash(credentials.password),
      emailVerified: false,
    });
  }

  private async isDisposablePlaceholder(
    link: UserRestaurant,
  ): Promise<boolean> {
    const [owners, categories, items, orders] = await Promise.all([
      this.userRestaurantRepo.findByRestaurantId(link.restaurantId),
      this.categoryRepo.findByRestaurantId(link.restaurantId),
      this.itemRepo.findByRestaurantId(link.restaurantId),
      this.orderRepo.countByRestaurantIdSince(link.restaurantId, new Date(0)),
    ]);
    return (
      owners.length === 1 &&
      categories.length === 0 &&
      items.length === 0 &&
      orders === 0
    );
  }

  private async discardPlaceholder(link: UserRestaurant): Promise<void> {
    await this.userRestaurantRepo.delete(link.id);
    await this.subscriptionRepo.deleteManyByRestaurantId(link.restaurantId);
    await this.restaurantRepo.delete(link.restaurantId);
  }

  private async ensureFreeSubscription(restaurantId: string): Promise<void> {
    const existing =
      await this.subscriptionRepo.findByRestaurantId(restaurantId);
    if (existing) return;
    await this.subscriptionRepo.create({
      restaurantId,
      plan: PlanTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      canceledAt: null,
      paymentProvider: PaymentProvider.NONE,
      externalCustomerId: null,
      externalSubscriptionId: null,
    });
  }
}
