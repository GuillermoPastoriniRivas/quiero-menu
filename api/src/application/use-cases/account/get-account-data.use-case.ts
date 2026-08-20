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
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { BillingRecordRepository } from '../../../domain/repositories/billing-record.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { UserNotFoundError } from '../../../domain/errors/domain-errors.js';

/**
 * Export de datos del usuario (ARCO: derecho de acceso).
 * Devuelve la cuenta y toda la data de sus restaurantes como JSON.
 */
export class GetAccountDataUseCase {
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
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly billingRecordRepo: BillingRecordRepository,
  ) {}

  async execute(
    userId: string,
  ): Promise<Result<Record<string, unknown>, UserNotFoundError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return err(new UserNotFoundError());

    const links = await this.userRestaurantRepo.findByUserId(userId);

    const restaurants = [];
    for (const link of links) {
      const restaurant = await this.restaurantRepo.findById(link.restaurantId);
      if (!restaurant) continue;

      const categories = await this.categoryRepo.findByRestaurantId(
        restaurant.id,
      );
      const allItems = await this.itemRepo.findByRestaurantId(restaurant.id);
      const variants = await this.variantRepo.findByItemIds(
        allItems.map((i) => i.id),
      );
      const options = await this.optionRepo.findByItemIds(
        allItems.map((i) => i.id),
      );

      const menu = categories.map((category) => ({
        category,
        items: allItems
          .filter((item) => item.categoryId === category.id)
          .map((item) => ({
            item,
            variants: variants.filter((v) => v.itemId === item.id),
            options: options.filter((o) => o.itemId === item.id),
          })),
      }));

      const page = await this.orderRepo.findByFilters({
        restaurantId: restaurant.id,
        page: 1,
        limit: 1000,
      });
      const orders = [];
      for (const order of page.data) {
        orders.push({
          order,
          items: await this.orderItemRepo.findByOrderId(order.id),
        });
      }

      restaurants.push({
        restaurant,
        menu,
        orders,
        operatingHours: await this.operatingHoursRepo.findByRestaurantId(
          restaurant.id,
        ),
        deliveryZones: await this.deliveryZoneRepo.findByRestaurantId(
          restaurant.id,
        ),
        subscription: await this.subscriptionRepo.findByRestaurantId(
          restaurant.id,
        ),
        billingRecords: await this.billingRecordRepo.findByRestaurantId(
          restaurant.id,
        ),
      });
    }

    return ok({
      exportedAt: new Date().toISOString(),
      user,
      restaurants,
    });
  }
}
