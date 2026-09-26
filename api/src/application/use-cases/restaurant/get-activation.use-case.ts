import type { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import type { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import type { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import type { OrderRepository } from '../../../domain/repositories/order.repository.js';
import {
  ACTIVATION_STEPS,
  countOpenDays,
  evaluateReadiness,
  summarizeReadiness,
  type ReadinessChecks,
  type ReadinessSummary,
} from '../../../domain/services/restaurant-readiness.js';
import { toWhatsAppNumber } from '../../../domain/services/whatsapp-number.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

export interface ActivationOutput {
  slug: string;
  checks: ReadinessChecks;
  summary: ReadinessSummary;
  details: {
    menuItems: number;
    openDays: number;
    orders: number;
    whatsapp: string | null;
    transferMissingAccount: boolean;
    sharedAt: Date | null;
  };
}

export class GetActivationUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly menuItemRepo: MenuItemRepository,
    private readonly hoursRepo: OperatingHoursRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(
    restaurantId: string,
  ): Promise<Result<ActivationOutput, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const [items, hours, orders] = await Promise.all([
      this.menuItemRepo.findByRestaurantId(restaurant.id),
      this.hoursRepo.findByRestaurantId(restaurant.id),
      this.orderRepo.countByRestaurantIdSince(restaurant.id, new Date(0)),
    ]);
    const menuItems = items.filter((item) => item.isVisible !== false).length;
    const openDays = countOpenDays(hours);
    const checks = evaluateReadiness({
      restaurant,
      menuItems,
      openDays,
      orders,
    });
    const methods = restaurant.paymentMethods;

    return ok({
      slug: restaurant.slug,
      checks,
      summary: summarizeReadiness(checks, ACTIVATION_STEPS),
      details: {
        menuItems,
        openDays,
        orders,
        whatsapp: toWhatsAppNumber(restaurant.phone),
        transferMissingAccount: Boolean(
          methods?.transferEnabled &&
          !methods.transferAlias?.trim() &&
          !methods.transferCbu?.trim(),
        ),
        sharedAt: restaurant.activation?.sharedAt ?? null,
      },
    });
  }
}

export class MarkRestaurantSharedUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(
    restaurantId: string,
    now: Date = new Date(),
  ): Promise<Result<{ sharedAt: Date }, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());
    const existing = restaurant.activation?.sharedAt;
    if (existing) return ok({ sharedAt: existing });
    await this.restaurantRepo.update(restaurant.id, {
      activation: { ...(restaurant.activation ?? {}), sharedAt: now },
    });
    return ok({ sharedAt: now });
  }
}
