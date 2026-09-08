import { createHash, randomBytes } from 'crypto';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { StoreClaimRepository } from '../../../domain/repositories/store-claim.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import type { EmailServicePort } from '../../ports/email-service.port.js';
import { Result, ok, err } from '../../common/result.js';
import {
  EmailAlreadyExistsError,
  ClaimNotPendingError,
} from '../../../domain/errors/domain-errors.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import { claimApprovedTemplate } from '../../../infrastructure/email/templates/claim-approved.template.js';

export interface ApproveStoreClaimInput {
  ownerName: string;
  email: string;
}

/**
 * El admin verificó por WhatsApp que el solicitante es el dueño y aprueba:
 * crea el usuario, lo vincula como OWNER, marca el local como reclamado y
 * le manda el email para crear su contraseña (token de 7 días, más amable
 * que los 30 minutos del reset normal).
 */
export class ApproveStoreClaimUseCase {
  constructor(
    private readonly claimRepo: StoreClaimRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly verificationTokenRepo: VerificationTokenRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly emailService: EmailServicePort,
    private readonly frontendUrl: string,
  ) {}

  async execute(
    claimId: string,
    input: ApproveStoreClaimInput,
  ): Promise<
    Result<{ userId: string; restaurantId: string }, EmailAlreadyExistsError>
  > {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim || claim.status !== 'pending')
      return err(new ClaimNotPendingError());

    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) return err(new EmailAlreadyExistsError());

    const restaurant = await this.restaurantRepo.findById(claim.restaurantId);
    if (!restaurant) return err(new ClaimNotPendingError());

    const passwordHash = await this.passwordHasher.hash(
      randomBytes(16).toString('hex'),
    );
    const user = await this.userRepo.create({
      name: input.ownerName,
      email: input.email,
      passwordHash,
      emailVerified: false,
    });

    await this.userRestaurantRepo.create({
      userId: user.id,
      restaurantId: restaurant.id,
      role: UserRole.OWNER,
    });

    const subscription = await this.subscriptionRepo.findByRestaurantId(
      restaurant.id,
    );
    if (!subscription) {
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
    }

    if (restaurant.claimed !== true) {
      await this.restaurantRepo.update(restaurant.id, { claimed: true });
    }
    await this.claimRepo.updateStatus(claim.id, 'approved');

    // Awaited pero no fatal: si el email falla, la cuenta ya existe y el
    // admin puede reenviar con "olvidé mi contraseña".
    await this.sendSetPasswordEmail(
      user.id,
      input.ownerName,
      input.email,
      restaurant.name,
    ).catch(() => {});

    return ok({ userId: user.id, restaurantId: restaurant.id });
  }

  private async sendSetPasswordEmail(
    userId: string,
    userName: string,
    email: string,
    restaurantName: string,
  ): Promise<void> {
    await this.verificationTokenRepo.deleteAllByUserId(
      userId,
      'password_reset',
    );
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.verificationTokenRepo.create({
      userId,
      tokenHash,
      type: 'password_reset',
      expiresAt,
    });
    const setUrl = `${this.frontendUrl}/reset-password?token=${rawToken}`;
    await this.emailService.send({
      to: email,
      subject: `Tu local ${restaurantName} ya es tuyo — creá tu contraseña`,
      html: claimApprovedTemplate(userName, restaurantName, setUrl),
    });
  }
}
