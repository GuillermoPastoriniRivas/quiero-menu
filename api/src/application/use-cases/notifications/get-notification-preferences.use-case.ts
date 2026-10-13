import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { Result, ok, err } from '../../common/result.js';
import { UserNotFoundError } from '../../../domain/errors/domain-errors.js';

export interface NotificationPreferencesOutput {
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  whatsappAvailable: boolean;
}

/**
 * Preferencias de aviso de pedidos del usuario logueado. `whatsappAvailable`
 * depende del plan del local de la sesión: los avisos por WhatsApp son Pro.
 */
export class GetNotificationPreferencesUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(
    userId: string,
    restaurantId: string,
  ): Promise<Result<NotificationPreferencesOutput, UserNotFoundError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return err(new UserNotFoundError());

    const subscription =
      await this.subscriptionRepo.findByRestaurantId(restaurantId);
    const whatsappAvailable =
      subscription?.status === SubscriptionStatus.ACTIVE &&
      subscription.plan === PlanTier.PRO;

    return ok({
      notifyEmail: user.notifyEmail,
      notifyWhatsapp: user.notifyWhatsapp,
      whatsappAvailable,
    });
  }
}
