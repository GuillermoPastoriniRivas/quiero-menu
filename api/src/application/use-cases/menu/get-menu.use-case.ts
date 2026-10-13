import type { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import type { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import type { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import type { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import type { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { deriveOptionGroups, effectiveGroupId } from '../../../domain/services/menu-option-groups.js';
import { resolveSharedMenuOptions } from '../../../domain/services/shared-menu-options.js';

export class GetMenuUseCase {
  constructor(
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(restaurantId: string) {
    const [restaurant, categories, items] = await Promise.all([
      this.restaurantRepo.findById(restaurantId),
      this.categoryRepo.findByRestaurantId(restaurantId),
      this.itemRepo.findByRestaurantId(restaurantId),
    ]);
    const ids = items.map((item) => item.id);
    const [variants, options] = ids.length ? await Promise.all([
      this.variantRepo.findByItemIds(ids), this.optionRepo.findByItemIds(ids),
    ]) : [[], []];
    return {
      restaurant,
      categories: categories.sort((a, b) => a.displayOrder - b.displayOrder).map((category) => ({
        ...category,
        items: items.filter((item) => item.categoryId === category.id)
          .sort((a, b) => a.displayOrder - b.displayOrder).map((item) => {
            const itemVariants = variants.filter((v) => v.itemId === item.id).sort((a, b) => a.displayOrder - b.displayOrder);
            const localOptions = options.filter((o) => o.itemId === item.id);
            const resolvedOptions = resolveSharedMenuOptions(item, localOptions, categories, items);
            return {
              ...item,
              components: item.components ?? [],
              isOrderable: !category.isOptionSource,
              optionGroups: (item.optionGroups ?? []).map((g) => ({ ...g, groupId: effectiveGroupId(g) })),
              variants: itemVariants,
              options: localOptions,
              resolvedOptions,
              effectiveOptionGroups: deriveOptionGroups(item, itemVariants, resolvedOptions),
            };
          }),
      })),
    };
  }
}
