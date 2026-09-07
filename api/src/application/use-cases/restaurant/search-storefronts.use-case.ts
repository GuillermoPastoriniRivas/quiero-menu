import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { OperatingHoursPolicy } from '../../../domain/services/operating-hours-policy.js';
import { getCategoryDef } from '../../../domain/constants/restaurant-categories.js';
import type { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import type { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';
import type { ActiveStorefrontSummary } from './list-active-storefronts.use-case.js';

export interface StorefrontSearchMatch {
  name: string;
  basePrice: number;
}

export interface StorefrontSearchResult extends ActiveStorefrontSummary {
  currency: string;
  /** Platos visibles que coinciden con la búsqueda (máx 3, orden de carta). */
  matchedItems: StorefrontSearchMatch[];
}

export interface StorefrontSearchInput {
  q?: string;
  citySlug?: string;
  openNow?: boolean;
  limit?: number;
}

export interface StorefrontSearchOutput {
  results: StorefrontSearchResult[];
  total: number;
}

const CACHE_TTL_MS = 60_000;
const MAX_MATCHED_ITEMS = 3;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Búsqueda del directorio: locales por nombre, rubro, descripción Y platos
 * de su carta visible. El comensal no busca "Leonardo's": busca "milanesa".
 *
 * Mantiene un índice en memoria (locales indexables + platos visibles) con
 * la misma cadencia de 60s que el índice del sitemap, así la búsqueda es
 * O(n) en RAM y no toca mongo por request.
 */
export class SearchStorefrontsUseCase {
  private readonly hoursPolicy = new OperatingHoursPolicy();
  private cache: {
    at: number;
    summaries: (ActiveStorefrontSummary & { currency: string })[];
    restaurantsBySlug: Map<string, Restaurant>;
    itemsByRestaurant: Map<string, StorefrontSearchMatch[]>;
    hoursByRestaurant: Map<string, OperatingHours[]>;
  } | null = null;

  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly hoursRepo: OperatingHoursRepository,
  ) {}

  async execute(input: StorefrontSearchInput): Promise<StorefrontSearchOutput> {
    const index = await this.getIndex();
    const q = normalize(input.q ?? '');
    const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
    const citySlug = normalize(input.citySlug ?? '');
    const openNow = input.openNow === true;
    const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);
    const now = new Date();

    const results: (StorefrontSearchResult & { score: number })[] = [];

    for (const summary of index.summaries) {
      const restaurant = index.restaurantsBySlug.get(summary.slug);
      if (!restaurant) continue;

      if (citySlug && summary.citySlug !== citySlug) continue;
      if (openNow) {
        const status = this.hoursPolicy.isOpen(
          restaurant,
          index.hoursByRestaurant.get(restaurant.id) ?? [],
          now,
        );
        if (!status.isOpen) continue;
      }

      let score = 0;
      let matchedItems: StorefrontSearchMatch[] = [];

      if (tokens.length > 0) {
        const nameN = normalize(summary.name);
        const descN = normalize(summary.description);
        const catDef = getCategoryDef(summary.category);
        const catN = normalize(
          `${catDef?.label ?? ''} ${catDef?.cuisine ?? ''} ${summary.category}`,
        );

        const nameMatch = tokens.every((t) => nameN.includes(t));
        const catMatch = tokens.some((t) => catN.includes(t));
        const descMatch =
          descN.length > 0 && tokens.every((t) => descN.includes(t));

        const dishMatches: { match: StorefrontSearchMatch; index: number }[] = [];
        const items = index.itemsByRestaurant.get(restaurant.id) ?? [];
        for (let i = 0; i < items.length; i++) {
          const itemN = normalize(items[i].name);
          if (tokens.every((t) => itemN.includes(t))) {
            dishMatches.push({ match: items[i], index: i });
          }
        }

        if (!nameMatch && !catMatch && !descMatch && dishMatches.length === 0) {
          continue;
        }

        if (nameMatch) score += 100;
        if (dishMatches.length > 0) score += 60 + dishMatches.length;
        if (catMatch) score += 50;
        if (descMatch) score += 30;

        matchedItems = dishMatches
          .sort((a, b) => a.index - b.index)
          .slice(0, MAX_MATCHED_ITEMS)
          .map((d) => d.match);
      }

      results.push({
        ...summary,
        currency: summary.currency,
        matchedItems,
        score,
      });
    }

    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    return { results: results.slice(0, limit), total: results.length };
  }

  private async getIndex() {
    const now = Date.now();
    if (this.cache && now - this.cache.at < CACHE_TTL_MS) return this.cache;

    const restaurants = await this.restaurantRepo.findByStatus(
      RestaurantStatus.ACTIVE,
    );

    const restaurantsBySlug = new Map<string, Restaurant>();
    const summaries: (ActiveStorefrontSummary & { currency: string })[] = [];
    for (const r of restaurants) {
      restaurantsBySlug.set(r.slug, r);
      summaries.push({
        slug: r.slug,
        name: r.name,
        city: r.city,
        citySlug: r.citySlug ?? '',
        category: r.category ?? '',
        description: r.description,
        logoUrl: r.logoUrl,
        bannerUrl: r.bannerUrl,
        phone: r.phone,
        isOpen: false,
        updatedAt: r.updatedAt,
        currency: r.currency,
      });
    }

    const ids = restaurants.map((r) => r.id);
    const [items, hours] = await Promise.all([
      ids.length > 0 ? this.itemRepo.findByRestaurantIds(ids) : [],
      ids.length > 0 ? this.hoursRepo.findByRestaurantIds(ids) : [],
    ]);

    const itemsByRestaurant = new Map<string, StorefrontSearchMatch[]>();
    for (const item of items) {
      if (!item.isVisible || !item.isAvailable) continue;
      const list = itemsByRestaurant.get(item.restaurantId) ?? [];
      list.push({ name: item.name, basePrice: item.basePrice });
      itemsByRestaurant.set(item.restaurantId, list);
    }

    const hoursByRestaurant = new Map<string, OperatingHours[]>();
    for (const h of hours) {
      const list = hoursByRestaurant.get(h.restaurantId) ?? [];
      list.push(h);
      hoursByRestaurant.set(h.restaurantId, list);
    }

    const nowDate = new Date();
    for (const summary of summaries) {
      const r = restaurantsBySlug.get(summary.slug)!;
      summary.isOpen = this.hoursPolicy.isOpen(
        r,
        hoursByRestaurant.get(r.id) ?? [],
        nowDate,
      ).isOpen;
    }

    this.cache = {
      at: now,
      summaries,
      restaurantsBySlug,
      itemsByRestaurant,
      hoursByRestaurant,
    };
    return this.cache;
  }
}
