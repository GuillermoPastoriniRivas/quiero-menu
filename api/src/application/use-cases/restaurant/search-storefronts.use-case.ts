import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { SearchTermRepository } from '../../../domain/repositories/search-term.repository.js';
import { FeaturedSlotRepository } from '../../../domain/repositories/featured-slot.repository.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { OperatingHoursPolicy } from '../../../domain/services/operating-hours-policy.js';
import { getCategoryDef } from '../../../domain/constants/restaurant-categories.js';
import type { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import type { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';
import type {
  ActiveStorefrontSummary,
  FeaturedSlotRef,
} from './list-active-storefronts.use-case.js';

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
  category?: string;
  openNow?: boolean;
  limit?: number;
}

export interface StorefrontSearchOutput {
  results: StorefrontSearchResult[];
  total: number;
  suggestions: StorefrontSearchSuggestion[];
}

export type StorefrontSearchSuggestionType =
  | 'dish'
  | 'restaurant'
  | 'category'
  | 'city';

export interface StorefrontSearchSuggestion {
  type: StorefrontSearchSuggestionType;
  label: string;
  value: string;
  count: number;
  citySlug?: string;
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

function searchable(text: string): string {
  return normalize(text)
    .replace(/(.)\1+/g, '$1')
    .replace(/\b(hamburguesas|empanadas|milanesas|pizzas|helados)\b/g, (word) =>
      word.slice(0, -1),
    );
}

function matches(text: string, tokens: string[]): boolean {
  const candidate = searchable(text);
  return tokens.every((token) => candidate.includes(searchable(token)));
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
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly hoursRepo: OperatingHoursRepository,
    private readonly searchTermRepo?: SearchTermRepository,
    private readonly featuredRepo?: FeaturedSlotRepository,
  ) {}

  async execute(input: StorefrontSearchInput): Promise<StorefrontSearchOutput> {
    const index = await this.getIndex();
    const q = normalize(input.q ?? '');
    const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
    const citySlug = normalize(input.citySlug ?? '');
    const category = normalize(input.category ?? '');
    const openNow = input.openNow === true;
    const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);
    const now = new Date();

    const results: (StorefrontSearchResult & { score: number })[] = [];

    for (const summary of index.summaries) {
      const restaurant = index.restaurantsBySlug.get(summary.slug);
      if (!restaurant) continue;

      if (citySlug && summary.citySlug !== citySlug) continue;
      if (category && normalize(summary.category) !== category) continue;
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
        const catDef = getCategoryDef(summary.category);
        const catText = `${catDef?.label ?? ''} ${catDef?.cuisine ?? ''} ${summary.category}`;

        const nameMatch = matches(summary.name, tokens);
        const catMatch = tokens.some((t) => matches(catText, [t]));
        const descMatch =
          summary.description.trim().length > 0 &&
          matches(summary.description, tokens);

        const dishMatches: { match: StorefrontSearchMatch; index: number }[] =
          [];
        const items = index.itemsByRestaurant.get(restaurant.id) ?? [];
        for (let i = 0; i < items.length; i++) {
          if (matches(items[i].name, tokens)) {
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

    // Inteligencia de demanda: qué buscan los comensales y qué no encuentran.
    // Fire-and-forget: nunca bloquea ni rompe la búsqueda.
    if (tokens.length > 0 && this.searchTermRepo) {
      const total = results.length;
      void this.searchTermRepo.record(q, total > 0).catch(() => {});
    }

    return {
      results: results.slice(0, limit),
      total: results.length,
      suggestions: this.buildSuggestions(index, tokens, citySlug, category),
    };
  }

  private buildSuggestions(
    index: NonNullable<SearchStorefrontsUseCase['cache']>,
    tokens: string[],
    citySlug: string,
    categoryFilter: string,
  ): StorefrontSearchSuggestion[] {
    if (tokens.length === 0) return [];

    const counts = new Map<string, StorefrontSearchSuggestion>();
    const add = (suggestion: Omit<StorefrontSearchSuggestion, 'count'>) => {
      if (!matches(suggestion.label, tokens)) return;
      const key = `${suggestion.type}:${normalize(suggestion.value)}:${suggestion.citySlug ?? ''}`;
      const current = counts.get(key);
      counts.set(key, { ...suggestion, count: (current?.count ?? 0) + 1 });
    };

    for (const summary of index.summaries) {
      if (citySlug && summary.citySlug !== citySlug) continue;
      if (categoryFilter && normalize(summary.category) !== categoryFilter)
        continue;
      add({
        type: 'restaurant',
        label: summary.name,
        value: summary.name,
        citySlug: summary.citySlug,
      });
      add({
        type: 'city',
        label: summary.city,
        value: summary.citySlug,
      });
      const category = getCategoryDef(summary.category);
      if (category) {
        add({
          type: 'category',
          label: category.label,
          value: summary.category,
          citySlug: summary.citySlug,
        });
      }
      for (const item of index.itemsByRestaurant.get(
        index.restaurantsBySlug.get(summary.slug)?.id ?? '',
      ) ?? []) {
        add({
          type: 'dish',
          label: item.name,
          value: item.name,
          citySlug: summary.citySlug,
        });
      }
    }

    const priority: Record<StorefrontSearchSuggestionType, number> = {
      dish: 0,
      restaurant: 1,
      category: 2,
      city: 3,
    };
    return [...counts.values()]
      .sort(
        (a, b) =>
          priority[a.type] - priority[b.type] ||
          b.count - a.count ||
          a.label.localeCompare(b.label),
      )
      .slice(0, 8);
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
        region: r.region ?? '',
        countrySlug: r.countrySlug ?? '',
        regionSlug: r.regionSlug ?? '',
        category: r.category ?? '',
        description: r.description,
        logoUrl: r.logoUrl,
        bannerUrl: r.bannerUrl,
        phone: r.phone,
        isOpen: false,
        hoursKnown: false,
        updatedAt: r.updatedAt,
        claimed: r.claimed !== false,
        lat: r.coordinates?.lat ?? null,
        lng: r.coordinates?.lng ?? null,
        currency: r.currency,
        featured: [],
      });
    }

    const ids = restaurants.map((r) => r.id);
    const categories =
      ids.length > 0 ? await this.categoryRepo.findByRestaurantIds(ids) : [];
    const [items, hours, slots] = await Promise.all([
      ids.length > 0 ? this.itemRepo.findByRestaurantIds(ids) : [],
      ids.length > 0 ? this.hoursRepo.findByRestaurantIds(ids) : [],
      this.featuredRepo ? this.featuredRepo.listActive(new Date()) : [],
    ]);

    const visibleCategoryIds = new Set(
      categories
        .filter((category) => category.isVisible)
        .map((category) => category.id),
    );
    const restaurantsWithMenu = new Set<string>();
    const itemsByRestaurant = new Map<string, StorefrontSearchMatch[]>();
    for (const item of items) {
      if (
        !item.isVisible ||
        !item.isAvailable ||
        !visibleCategoryIds.has(item.categoryId)
      )
        continue;
      const list = itemsByRestaurant.get(item.restaurantId) ?? [];
      list.push({ name: item.name, basePrice: item.basePrice });
      itemsByRestaurant.set(item.restaurantId, list);
      restaurantsWithMenu.add(item.restaurantId);
    }

    const hoursByRestaurant = new Map<string, OperatingHours[]>();
    for (const h of hours) {
      const list = hoursByRestaurant.get(h.restaurantId) ?? [];
      list.push(h);
      hoursByRestaurant.set(h.restaurantId, list);
    }

    const nowDate = new Date();
    const featuredByRestaurant = new Map<string, FeaturedSlotRef[]>();
    for (const s of slots) {
      const list = featuredByRestaurant.get(s.restaurantId) ?? [];
      list.push({
        scope: s.scope,
        citySlug: s.citySlug,
        category: s.category,
      });
      featuredByRestaurant.set(s.restaurantId, list);
    }
    const publicSummaries = summaries.filter((summary) => {
      const restaurant = restaurantsBySlug.get(summary.slug);
      if (!restaurant) return false;
      // Mismo criterio que el index: el local con carta O la ficha de
      // inventario sin dueño son resultados válidos.
      return (
        restaurantsWithMenu.has(restaurant.id) || restaurant.claimed === false
      );
    });
    for (const summary of publicSummaries) {
      const r = restaurantsBySlug.get(summary.slug)!;
      summary.isOpen = this.hoursPolicy.isOpen(
        r,
        hoursByRestaurant.get(r.id) ?? [],
        nowDate,
      ).isOpen;
      summary.hoursKnown =
        r.openOverride !== null ||
        (hoursByRestaurant.get(r.id)?.length ?? 0) > 0;
      summary.featured = featuredByRestaurant.get(r.id) ?? [];
    }

    this.cache = {
      at: now,
      summaries: publicSummaries,
      restaurantsBySlug,
      itemsByRestaurant,
      hoursByRestaurant,
    };
    return this.cache;
  }
}
