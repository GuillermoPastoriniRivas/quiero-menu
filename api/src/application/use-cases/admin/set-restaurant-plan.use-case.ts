import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';

export interface SetRestaurantPlanInput {
  restaurantId: string;
  plan: PlanTier;
}

/**
 * Cambia el plan del local a mano desde el panel admin (regalar o quitar Pro),
 * sin pasar por el cobro. El plan efectivo se calcula en lectura a partir de
 * `plan` + `status`, así que alcanza con dejar la suscripción en `active` sin
 * fecha de fin: un Pro regalado no vence solo y no lo tocan los webhooks porque
 * no tiene `externalSubscriptionId`.
 */
export class SetRestaurantPlanUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(
    input: SetRestaurantPlanInput,
  ): Promise<
    Result<
      { plan: PlanTier; status: SubscriptionStatus },
      RestaurantNotFoundError
    >
  > {
    const restaurant = await this.restaurantRepo.findById(input.restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const existing = await this.subscriptionRepo.findByRestaurantId(
      input.restaurantId,
    );

    if (existing) {
      const updated = await this.subscriptionRepo.update(existing.id, {
        plan: input.plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
        canceledAt: null,
        ...(input.plan === PlanTier.PRO
          ? { paymentProvider: PaymentProvider.NONE }
          : {}),
      });
      if (!updated) return err(new RestaurantNotFoundError());
      return ok({ plan: updated.plan, status: updated.status });
    }

    const created = await this.subscriptionRepo.create({
      restaurantId: input.restaurantId,
      plan: input.plan,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      canceledAt: null,
      paymentProvider: PaymentProvider.NONE,
      externalCustomerId: null,
      externalSubscriptionId: null,
    });
    return ok({ plan: created.plan, status: created.status });
  }
}
