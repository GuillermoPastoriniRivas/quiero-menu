import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { OperatingHoursPolicy } from '../../../domain/services/operating-hours-policy.js';

export interface ActiveStorefrontSummary {
  slug: string;
  name: string;
  city: string;
  /** Slug normalizado de la ciudad para el directorio (/en/{citySlug}). */
  citySlug: string;
  /** Rubro del local ('' = sin clasificar). */
  category: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  /** Teléfono público para el CTA de WhatsApp en el directorio. */
  phone: string;
  /** Abierto ahora (horario + override, en la timezone del local). */
  isOpen: boolean;
  updatedAt: Date;
}

const CACHE_TTL_MS = 60_000;

/**
 * Lista los storefronts indexables: restaurantes ACTIVOS con al menos una
 * categoría visible con al menos un ítem visible. Cache corta (60s) para no
 * golpear mongo en cada request de build/sitemap/crawl/directorio.
 */
export class ListActiveStorefrontsUseCase {
  private cache: { at: number; value: ActiveStorefrontSummary[] } | null = null;
  private readonly hoursPolicy = new OperatingHoursPolicy();

  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly hoursRepo: OperatingHoursRepository,
  ) {}

  async execute(): Promise<ActiveStorefrontSummary[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.at < CACHE_TTL_MS) {
      return this.cache.value;
    }
    const value = await this.build();
    this.cache = { at: now, value };
    return value;
  }

  private async build(): Promise<ActiveStorefrontSummary[]> {
    const restaurants = await this.restaurantRepo.findByStatus(
      RestaurantStatus.ACTIVE,
    );
    if (restaurants.length === 0) return [];

    const ids = restaurants.map((r) => r.id);
    const [categories, items, hours] = await Promise.all([
      this.categoryRepo.findByRestaurantIds(ids),
      this.itemRepo.findByRestaurantIds(ids),
      this.hoursRepo.findByRestaurantIds(ids),
    ]);

    const itemsByCategory = new Map<string, number>();
    for (const item of items) {
      if (!item.isVisible) continue;
      itemsByCategory.set(
        item.categoryId,
        (itemsByCategory.get(item.categoryId) ?? 0) + 1,
      );
    }

    const withMenu = new Set<string>();
    for (const cat of categories) {
      if (!cat.isVisible) continue;
      if ((itemsByCategory.get(cat.id) ?? 0) > 0)
        withMenu.add(cat.restaurantId);
    }

    const hoursByRestaurant = new Map<string, typeof hours>();
    for (const h of hours) {
      const list = hoursByRestaurant.get(h.restaurantId) ?? [];
      list.push(h);
      hoursByRestaurant.set(h.restaurantId, list);
    }

    const nowDate = new Date();
    return restaurants
      .filter((r) => withMenu.has(r.id))
      .map((r) => ({
        slug: r.slug,
        name: r.name,
        city: r.city,
        citySlug: r.citySlug ?? '',
        category: r.category ?? '',
        description: r.description,
        logoUrl: r.logoUrl,
        bannerUrl: r.bannerUrl,
        phone: r.phone,
        isOpen: this.hoursPolicy.isOpen(
          r,
          hoursByRestaurant.get(r.id) ?? [],
          nowDate,
        ).isOpen,
        updatedAt: r.updatedAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
