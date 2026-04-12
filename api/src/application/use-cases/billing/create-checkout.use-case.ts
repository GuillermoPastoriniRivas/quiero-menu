import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { PaymentProviderPort, CreateCheckoutResult } from '../../ports/payment-provider.port.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { Result, ok, err } from '../../common/result.js';
import { DomainError } from '../../../domain/errors/domain-errors.js';

export interface CreateCheckoutInput {
  restaurantId: string;
  userId: string;
}

export class CreateCheckoutUseCase {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly userRepo: UserRepository,
    private readonly paymentProvider: PaymentProviderPort,
  ) {}

  async execute(input: CreateCheckoutInput): Promise<Result<CreateCheckoutResult, DomainError>> {
    const existing = await this.subscriptionRepo.findByRestaurantId(input.restaurantId);
    if (existing && existing.status === SubscriptionStatus.ACTIVE && existing.plan === PlanTier.PRO) {
      return err(new DomainError('ALREADY_PRO', 'Already subscribed to Pro plan.'));
    }

    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      return err(new DomainError('USER_NOT_FOUND', 'User not found.'));
    }

    try {
      const result = await this.paymentProvider.createCheckout({
        tenantId: input.restaurantId,
        customerEmail: user.email,
        plan: PlanTier.PRO,
        successUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/settings?section=billing&success=true`,
      });
      return ok(result);
    } catch (error) {
      return err(new DomainError('CHECKOUT_CREATION_ERROR', (error as Error).message));
    }
  }
}
