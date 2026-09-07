import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { RestaurantCategory } from '../../../domain/enums/restaurant-category.enum.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { slugifyCity } from '../../common/slugify.js';

export interface BackfillDirectoryResult {
  citySlugFixed: number;
  categoryInferred: number;
}

const CATEGORY_KEYWORDS: {
  category: RestaurantCategory;
  keywords: string[];
}[] = [
  {
    category: RestaurantCategory.PIZZERIA,
    keywords: [
      'pizza',
      'pizzas',
      'pizzeta',
      'faina',
      'empanadas de jamon y queso',
    ],
  },
  {
    category: RestaurantCategory.HAMBURGUESERIA,
    keywords: ['hamburguesa', 'hamburguesas', 'burger', 'cheddar', 'panceta'],
  },
  {
    category: RestaurantCategory.EMPANADERIA,
    keywords: ['empanada', 'empanadas'],
  },
  {
    category: RestaurantCategory.HELADERIA,
    keywords: ['helado', 'helados', 'cucurucho', 'alfajor de agua'],
  },
  {
    category: RestaurantCategory.SUSHI,
    keywords: ['sushi', 'geisha', 'roll', 'nigiri', 'ceviche'],
  },
  {
    category: RestaurantCategory.CAFE,
    keywords: [
      'cafe con leche',
      'capuchino',
      'cappuccino',
      'flat white',
      'latte',
      'medialunas',
    ],
  },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Completa citySlug y category de los locales que los crearon antes de que
 * existieran. Solo llena lo vacío (idempotente): no pisa decisiones del dueño.
 * La categoría se infiere de los platos con keywords conservadoras; si no hay
 * señal fuerte, queda sin clasificar para que la edite el local.
 */
export class BackfillDirectoryDataUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly itemRepo: MenuItemRepository,
  ) {}

  async execute(): Promise<BackfillDirectoryResult> {
    // Mismo criterio que el índice del directorio: solo locales activos.
    const restaurants = await this.restaurantRepo.findByStatus(
      RestaurantStatus.ACTIVE,
    );
    const needsCategoryIds: string[] = [];
    let citySlugFixed = 0;
    let categoryInferred = 0;

    for (const r of restaurants) {
      const patch: Record<string, string> = {};
      if (!r.citySlug && r.city) {
        patch.citySlug = slugifyCity(r.city);
      }
      if (!r.category) {
        needsCategoryIds.push(r.id);
      }
      if (Object.keys(patch).length > 0) {
        await this.restaurantRepo.update(r.id, patch);
        citySlugFixed++;
      }
    }

    if (needsCategoryIds.length > 0) {
      const items = await this.itemRepo.findByRestaurantIds(needsCategoryIds);
      const itemsByRestaurant = new Map<string, string>();
      for (const item of items) {
        if (!item.isVisible) continue;
        const current = itemsByRestaurant.get(item.restaurantId) ?? '';
        itemsByRestaurant.set(
          item.restaurantId,
          `${current} ${normalize(item.name)}`,
        );
      }
      for (const id of needsCategoryIds) {
        const text = itemsByRestaurant.get(id) ?? '';
        const category = inferCategory(text);
        if (category) {
          await this.restaurantRepo.update(id, { category });
          categoryInferred++;
        }
      }
    }

    return { citySlugFixed, categoryInferred };
  }
}

function inferCategory(menuText: string): RestaurantCategory | undefined {
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some((k) => menuText.includes(k))) {
      return rule.category;
    }
  }
  return undefined;
}
