import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { MenuCategory } from '../../../domain/entities/menu-category.entity.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { MenuItemVariant } from '../../../domain/entities/menu-item-variant.entity.js';
import { MenuItemOption } from '../../../domain/entities/menu-item-option.entity.js';
import { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';
import { DeliveryZone } from '../../../domain/entities/delivery-zone.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

export interface StorefrontData {
  restaurant: Restaurant;
  categories: (MenuCategory & { items: (MenuItem & { variants: MenuItemVariant[]; options: MenuItemOption[] })[] })[];
  operatingHours: OperatingHours[];
  deliveryZones: DeliveryZone[];
}

export class GetRestaurantBySlugUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly hoursRepo: OperatingHoursRepository,
    private readonly zoneRepo: DeliveryZoneRepository,
  ) {}

  async execute(slug: string): Promise<Result<StorefrontData, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const [rawCategories, allItems, operatingHours, deliveryZones] = await Promise.all([
      this.categoryRepo.findByRestaurantId(restaurant.id),
      this.itemRepo.findByRestaurantId(restaurant.id),
      this.hoursRepo.findByRestaurantId(restaurant.id),
      this.zoneRepo.findByRestaurantId(restaurant.id),
    ]);

    const visibleCategories = rawCategories
      .filter((c) => c.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const itemsByCategory = new Map<string, MenuItem[]>();
    for (const item of allItems) {
      if (!item.isVisible) continue;
      const list = itemsByCategory.get(item.categoryId) ?? [];
      list.push(item);
      itemsByCategory.set(item.categoryId, list);
    }

    const visibleItemIds = allItems.filter((i) => i.isVisible).map((i) => i.id);

    const [allVariants, allOptions] = visibleItemIds.length > 0
      ? await Promise.all([
          this.variantRepo.findByItemIds(visibleItemIds),
          this.optionRepo.findByItemIds(visibleItemIds),
        ])
      : [[], []];

    const variantsByItem = new Map<string, MenuItemVariant[]>();
    for (const v of allVariants) {
      const list = variantsByItem.get(v.itemId) ?? [];
      list.push(v);
      variantsByItem.set(v.itemId, list);
    }

    const optionsByItem = new Map<string, MenuItemOption[]>();
    for (const o of allOptions) {
      if (!o.isAvailable) continue;
      const list = optionsByItem.get(o.itemId) ?? [];
      list.push(o);
      optionsByItem.set(o.itemId, list);
    }

    const categories = visibleCategories.map((cat) => {
      const items = (itemsByCategory.get(cat.id) ?? [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => ({
          ...item,
          variants: variantsByItem.get(item.id) ?? [],
          options: optionsByItem.get(item.id) ?? [],
        }));
      return { ...cat, items };
    });

    return ok({ restaurant, categories, operatingHours, deliveryZones });
  }
}
