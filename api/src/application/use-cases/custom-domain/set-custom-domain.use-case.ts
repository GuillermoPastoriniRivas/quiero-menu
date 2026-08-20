import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { Result, ok, err } from '../../common/result.js';
import {
  CustomDomainInvalidError,
  CustomDomainAlreadyInUseError,
  CustomDomainRequiresProError,
  RestaurantNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import {
  normalizeDomain,
  validateDomain,
  isOwnDomain,
} from '../../../domain/services/custom-domain-policy.js';

export class SetCustomDomainUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly ownDomains: string[],
  ) {}

  async execute(
    restaurantId: string,
    rawDomain: string,
  ): Promise<
    Result<
      Restaurant,
      | CustomDomainInvalidError
      | CustomDomainAlreadyInUseError
      | CustomDomainRequiresProError
      | RestaurantNotFoundError
    >
  > {
    const domain = normalizeDomain(rawDomain);
    const validation = validateDomain(domain);
    if (validation) return err(new CustomDomainInvalidError(validation));
    if (isOwnDomain(domain, this.ownDomains)) {
      return err(
        new CustomDomainInvalidError(
          'No podés usar un dominio de quiero.menu como dominio personalizado.',
        ),
      );
    }

    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const subscription =
      await this.subscriptionRepo.findByRestaurantId(restaurantId);
    const isPro =
      subscription?.status === SubscriptionStatus.ACTIVE &&
      subscription.plan === PlanTier.PRO;
    if (!isPro) return err(new CustomDomainRequiresProError());

    const existing = await this.restaurantRepo.findByCustomDomain(domain);
    if (existing && existing.id !== restaurantId) {
      return err(new CustomDomainAlreadyInUseError());
    }

    const updated = await this.restaurantRepo.update(restaurantId, {
      customDomain: domain,
      customDomainStatus: { state: 'pending', requestedAt: new Date() },
    });
    if (!updated) return err(new RestaurantNotFoundError());
    return ok(updated);
  }
}
