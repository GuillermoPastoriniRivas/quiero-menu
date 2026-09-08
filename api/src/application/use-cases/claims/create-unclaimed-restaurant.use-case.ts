import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { SlugAlreadyExistsError } from '../../../domain/errors/domain-errors.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { RestaurantCategory } from '../../../domain/enums/restaurant-category.enum.js';
import { PlanTier } from '../../../domain/enums/plan-tier.enum.js';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum.js';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum.js';
import { slugifyCity } from '../../common/slugify.js';

export interface CreateUnclaimedRestaurantInput {
  restaurantName: string;
  restaurantSlug: string;
  city?: string;
  category?: RestaurantCategory;
  currency?: string;
  timezone?: string;
}

/**
 * Alta de inventario: el equipo carga el local sin dueño (sin usuario).
 * Nace con claimed=false para que el storefront muestre el banner de
 * reclamo, y con suscripción FREE para que valgan todas las invariantes
 * (billing, límites, panel cuando reclame).
 */
export class CreateUnclaimedRestaurantUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(
    input: CreateUnclaimedRestaurantInput,
  ): Promise<
    Result<{ restaurantId: string; slug: string }, SlugAlreadyExistsError>
  > {
    const existingSlug = await this.restaurantRepo.findBySlug(
      input.restaurantSlug,
    );
    if (existingSlug) return err(new SlugAlreadyExistsError());

    const restaurant = await this.restaurantRepo.create({
      slug: input.restaurantSlug,
      name: input.restaurantName,
      description: '',
      logoUrl: '',
      bannerUrl: '',
      address: '',
      city: input.city ?? '',
      citySlug: slugifyCity(input.city ?? ''),
      category: input.category ?? RestaurantCategory.NONE,
      country: 'AR',
      coordinates: null,
      phone: '',
      timezone: input.timezone ?? 'America/Argentina/Buenos_Aires',
      currency: input.currency ?? 'ARS',
      status: RestaurantStatus.ACTIVE,
      openOverride: null,
      customDomain: null,
      customDomainStatus: null,
      socialLinks: null,
      paymentMethods: {
        cashEnabled: true,
        cardEnabled: true,
        transferEnabled: true,
      },
      theme: { primaryColor: '#E8532C' },
      claimed: false,
    });

    await this.subscriptionRepo.create({
      restaurantId: restaurant.id,
      plan: PlanTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      canceledAt: null,
      paymentProvider: PaymentProvider.NONE,
      externalCustomerId: null,
      externalSubscriptionId: null,
    });

    return ok({ restaurantId: restaurant.id, slug: restaurant.slug });
  }
}
