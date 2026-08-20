import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { KitchenAccessTokenRepository } from '../../../domain/repositories/kitchen-access-token.repository.js';
import { DeliveryAccessTokenRepository } from '../../../domain/repositories/delivery-access-token.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { BillingRecordRepository } from '../../../domain/repositories/billing-record.repository.js';
import { PushSubscriptionRepository } from '../../../domain/repositories/push-subscription.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { PaymentProviderPort } from '../../ports/payment-provider.port.js';
import { Result, ok, err } from '../../common/result.js';
import {
  UserNotFoundError,
  InvalidCredentialsError,
} from '../../../domain/errors/domain-errors.js';

/**
 * Baja de cuenta (ARCO: derecho de cancelación).
 * Requiere la contraseña como confirmación. Cancela la suscripción activa
 * (best-effort) y borra en cascada toda la data del usuario y sus restaurantes.
 */
export class DeleteAccountUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly operatingHoursRepo: OperatingHoursRepository,
    private readonly deliveryZoneRepo: DeliveryZoneRepository,
    private readonly kitchenTokenRepo: KitchenAccessTokenRepository,
    private readonly deliveryTokenRepo: DeliveryAccessTokenRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly billingRecordRepo: BillingRecordRepository,
    private readonly pushSubRepo: PushSubscriptionRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly verificationTokenRepo: VerificationTokenRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly paymentProvider: PaymentProviderPort,
  ) {}

  async execute(
    userId: string,
    password: string,
  ): Promise<Result<void, UserNotFoundError | InvalidCredentialsError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return err(new UserNotFoundError());

    const passwordOk = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );
    if (!passwordOk) return err(new InvalidCredentialsError());

    const links = await this.userRestaurantRepo.findByUserId(userId);

    for (const link of links) {
      await this.deleteRestaurant(link.restaurantId);
      await this.userRestaurantRepo.delete(link.id);
    }

    // Data a nivel de usuario.
    await this.refreshTokenRepo.deleteAllByUserId(userId);
    await this.verificationTokenRepo.deleteAllByUserId(
      userId,
      'email_verification',
    );
    await this.verificationTokenRepo.deleteAllByUserId(
      userId,
      'password_reset',
    );
    await this.pushSubRepo.deleteManyByUserId(userId);

    await this.userRepo.delete(userId);

    return ok(undefined);
  }

  private async deleteRestaurant(restaurantId: string): Promise<void> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return;

    // Suscripción: cancelar en el proveedor (best-effort) y borrar localmente.
    const subscription =
      await this.subscriptionRepo.findByRestaurantId(restaurantId);
    if (subscription?.externalSubscriptionId) {
      try {
        await this.paymentProvider.cancelSubscription(
          subscription.externalSubscriptionId,
        );
      } catch {
        // No bloquea la baja; la cancelación externa se puede hacer manual.
      }
    }
    await this.subscriptionRepo.deleteManyByRestaurantId(restaurantId);
    await this.billingRecordRepo.deleteManyByRestaurantId(restaurantId);

    // Menú en cascada: categorías → items → variantes/opciones.
    const categories = await this.categoryRepo.findByRestaurantId(restaurantId);
    for (const category of categories) {
      const items = await this.itemRepo.findByCategoryId(category.id);
      for (const item of items) {
        await this.variantRepo.deleteByItemId(item.id);
        await this.optionRepo.deleteByItemId(item.id);
      }
      await this.itemRepo.deleteByCategoryId(category.id);
      await this.categoryRepo.delete(category.id);
    }

    // Órdenes + items.
    await this.orderItemRepo.deleteManyByRestaurantId(restaurantId);
    await this.orderRepo.deleteManyByRestaurantId(restaurantId);

    await this.operatingHoursRepo.deleteByRestaurantId(restaurantId);
    await this.deliveryZoneRepo.deleteManyByRestaurantId(restaurantId);
    await this.kitchenTokenRepo.deleteManyByRestaurantId(restaurantId);
    await this.deliveryTokenRepo.deleteManyByRestaurantId(restaurantId);
    await this.pushSubRepo.deleteManyByRestaurantId(restaurantId);

    await this.restaurantRepo.delete(restaurantId);
  }
}
