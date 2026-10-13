import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { Result, ok, err } from '../../common/result.js';
import {
  UserNotFoundError,
  WhatsappAlertsRequireProError,
} from '../../../domain/errors/domain-errors.js';
import { NotificationPreferencesOutput } from './get-notification-preferences.use-case.js';

export interface UpdateNotificationPreferencesInput {
  userId: string;
  restaurantId: string;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
}

/**
 * Actualiza las preferencias de aviso de pedidos. Activar los avisos por
 * WhatsApp requiere plan Pro: en free se rechaza para que el cobro no dependa
 * solo de la UI.
 */
export class UpdateNotificationPreferencesUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(
    input: UpdateNotificationPreferencesInput,
  ): Promise<
    Result<
      NotificationPreferencesOutput,
      UserNotFoundError | WhatsappAlertsRequireProError
    >
  > {
    const user = await this.userRepo.findById(input.userId);
    if (!user) return err(new UserNotFoundError());

    const subscription = await this.subscriptionRepo.findByRestaurantId(
      input.restaurantId,
    );
    const whatsappAvailable =
      subscription?.status === SubscriptionStatus.ACTIVE &&
      subscription.plan === PlanTier.PRO;

    if (input.notifyWhatsapp === true && !whatsappAvailable)
      return err(new WhatsappAlertsRequireProError());

    const updated = await this.userRepo.updateNotificationPreferences(
      input.userId,
      {
        notifyEmail: input.notifyEmail,
        notifyWhatsapp: input.notifyWhatsapp,
      },
    );
    if (!updated) return err(new UserNotFoundError());

    return ok({
      notifyEmail: updated.notifyEmail,
      notifyWhatsapp: updated.notifyWhatsapp,
      whatsappAvailable,
    });
  }
}
