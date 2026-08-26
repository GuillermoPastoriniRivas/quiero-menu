import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';

export interface AdminRestaurantDetailOutput {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    description: string;
    city: string;
    country: string;
    address: string;
    phone: string;
    currency: string;
    timezone: string;
    status: string;
    openOverride: 'open' | 'closed' | null;
    customDomain: string | null;
    customDomainStatus: unknown;
    createdAt: Date;
    updatedAt: Date;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  } | null;
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
    paymentProvider: string;
    canceledAt: Date | null;
  } | null;
  stats: {
    ordersTotal: number;
    ordersLast30d: number;
    categories: number;
    products: number;
  };
}

export class GetRestaurantDetailUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly orderRepo: OrderRepository,
    private readonly menuCategoryRepo: MenuCategoryRepository,
    private readonly menuItemRepo: MenuItemRepository,
  ) {}

  async execute(
    restaurantId: string,
  ): Promise<Result<AdminRestaurantDetailOutput, RestaurantNotFoundError>> {
    const r = await this.restaurantRepo.findById(restaurantId);
    if (!r) return err(new RestaurantNotFoundError());

    const links = await this.userRestaurantRepo.findByRestaurantId(r.id);
    const ownerLink =
      links.find((l) => l.role === UserRole.OWNER) ?? links[0] ?? null;
    const owner = ownerLink
      ? await this.userRepo.findById(ownerLink.userId)
      : null;

    const subscription = await this.subscriptionRepo.findByRestaurantId(r.id);

    const now = new Date();
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [ordersTotal, ordersLast30d, categories, products] =
      await Promise.all([
        this.orderRepo.countByRestaurantIdSince(r.id, new Date(0)),
        this.orderRepo.countByRestaurantIdSince(r.id, since30d),
        this.menuCategoryRepo.findByRestaurantId(r.id),
        this.menuItemRepo.findByRestaurantId(r.id),
      ]);

    return ok({
      restaurant: {
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        city: r.city,
        country: r.country,
        address: r.address,
        phone: r.phone,
        currency: r.currency,
        timezone: r.timezone,
        status: r.status,
        openOverride: r.openOverride,
        customDomain: r.customDomain,
        customDomainStatus: r.customDomainStatus,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
      owner: owner
        ? {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            emailVerified: owner.emailVerified,
          }
        : null,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            paymentProvider: subscription.paymentProvider,
            canceledAt: subscription.canceledAt,
          }
        : null,
      stats: {
        ordersTotal,
        ordersLast30d,
        categories: categories.length,
        products: products.length,
      },
    });
  }
}
