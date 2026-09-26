import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { StoreClaimRepository } from '../../../domain/repositories/store-claim.repository.js';
import type {
  PaymentMethodsConfig,
  PhotoGalleryImage,
} from '../../../domain/entities/restaurant.entity.js';
import type {
  InsightDemand,
  RestaurantInsightsQuery,
} from '../../ports/restaurant-insights.port.js';
import type {
  ReadinessChecks,
  ReadinessSummary,
} from '../../../domain/services/restaurant-readiness.js';
import { toWhatsAppNumber } from '../../../domain/services/whatsapp-number.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import {
  AdminRestaurantIndex,
  type AdminStage,
} from './admin-restaurant-index.js';
import { describeActivity, type AdminActivityEntry } from './admin-activity.js';

export interface AdminRestaurantDetailOutput {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    description: string;
    logoUrl: string;
    bannerUrl: string;
    address: string;
    city: string;
    region: string;
    country: string;
    category: string;
    coordinates: { lat: number; lng: number } | null;
    phone: string;
    whatsapp: string | null;
    currency: string;
    timezone: string;
    status: string;
    claimed: boolean;
    openOverride: 'open' | 'closed' | null;
    customDomain: string | null;
    photoGallery: PhotoGalleryImage[];
    socialLinks: {
      instagram?: string;
      facebook?: string;
      tiktok?: string;
    } | null;
    paymentMethods: PaymentMethodsConfig;
    createdAt: Date;
    updatedAt: Date;
  };
  stage: AdminStage;
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
  invitation: {
    id: string;
    email: string | null;
    expiresAt: Date;
    createdAt: Date;
  } | null;
  readiness: {
    checks: ReadinessChecks;
    listing: ReadinessSummary;
    activation: ReadinessSummary;
  };
  stats: {
    ordersTotal: number;
    ordersLast30d: number;
    categories: number;
    products: number;
    openDays: number;
  };
  demand30d: InsightDemand;
  pendingClaims: {
    id: string;
    name: string;
    phone: string;
    email: string;
    message: string;
    createdAt: Date;
  }[];
  timeline: AdminActivityEntry[];
  flags: { ordersWithoutOwner: boolean };
}

export class GetRestaurantDetailUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly orderRepo: OrderRepository,
    private readonly menuCategoryRepo: MenuCategoryRepository,
    private readonly claimRepo: StoreClaimRepository,
    private readonly index: AdminRestaurantIndex,
    private readonly insights: RestaurantInsightsQuery,
  ) {}

  async execute(
    restaurantId: string,
  ): Promise<Result<AdminRestaurantDetailOutput, RestaurantNotFoundError>> {
    const r = await this.restaurantRepo
      .findById(restaurantId)
      .catch(() => null);
    if (!r) return err(new RestaurantNotFoundError());

    const [[row], subscription, categories, ordersTotal, claims, entries] =
      await Promise.all([
        this.index.rowsFor([r]),
        this.subscriptionRepo.findByRestaurantId(r.id),
        this.menuCategoryRepo.findByRestaurantId(r.id),
        this.orderRepo.countByRestaurantIdSince(r.id, new Date(0)),
        this.claimRepo.findPendingByRestaurantId(r.id),
        this.insights.timeline(r.id, 150),
      ]);

    const ownerUser = row.owner
      ? await this.userRepo.findById(row.owner.userId)
      : null;
    const timeline = await describeActivity(
      this.insights,
      entries,
      new Map([[r.id, { id: r.id, name: r.name, slug: r.slug }]]),
      40,
    );

    return ok({
      restaurant: {
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        logoUrl: r.logoUrl,
        bannerUrl: r.bannerUrl,
        address: r.address,
        city: r.city,
        region: r.region ?? '',
        country: r.country,
        category: r.category ?? '',
        coordinates: r.coordinates,
        phone: r.phone,
        whatsapp: toWhatsAppNumber(r.phone),
        currency: r.currency,
        timezone: r.timezone,
        status: r.status,
        claimed: r.claimed !== false,
        openOverride: r.openOverride,
        customDomain: r.customDomain,
        photoGallery: r.photoGallery ?? [],
        socialLinks: r.socialLinks,
        paymentMethods: r.paymentMethods,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      },
      stage: row.stage,
      owner: ownerUser
        ? {
            id: ownerUser.id,
            name: ownerUser.name,
            email: ownerUser.email,
            emailVerified: ownerUser.emailVerified,
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
      invitation: row.invitation,
      readiness: {
        checks: row.checks,
        listing: row.listing,
        activation: row.activation,
      },
      stats: {
        ordersTotal,
        ordersLast30d: row.orders30d,
        categories: categories.length,
        products: row.menuItems,
        openDays: row.openDays,
      },
      demand30d: row.demand30d,
      pendingClaims: claims.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        message: c.message,
        createdAt: c.createdAt,
      })),
      timeline,
      flags: { ordersWithoutOwner: row.ordersWithoutOwner },
    });
  }
}
