import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { MenuItemOptionGroup } from '../../../domain/entities/menu-item-option-group.entity.js';
import type { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import type { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { validateOptionGroupConfiguration } from '../../../domain/services/menu-option-groups.js';
import type { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { resolveSharedMenuOptions } from '../../../domain/services/shared-menu-options.js';
import { Result, ok, err } from '../../common/result.js';
import {
  MenuItemNotFoundError,
  CrossRestaurantAccessError,
  MenuItemOptionLimitError,
} from '../../../domain/errors/domain-errors.js';

export class UpdateMenuItemOptionGroupsUseCase {
  constructor(
    private readonly itemRepo: MenuItemRepository,
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly categoryRepo?: MenuCategoryRepository,
  ) {}

  async execute(
    id: string,
    restaurantId: string,
    groups: MenuItemOptionGroup[],
  ): Promise<
    Result<
      MenuItem,
      | MenuItemNotFoundError
      | CrossRestaurantAccessError
      | MenuItemOptionLimitError
    >
  > {
    const existing = await this.itemRepo.findById(id);
    if (!existing) return err(new MenuItemNotFoundError());
    if (existing.restaurantId !== restaurantId)
      return err(new CrossRestaurantAccessError());

    const normalized = groups
      .map(
        (g, index) =>
          new MenuItemOptionGroup(
            g.name.trim(),
            Math.max(0, Math.floor(g.minSelections || 0)),
            Math.max(0, Math.floor(g.maxSelections || 0)),
            g.variantId ?? null,
            g.displayOrder ?? index,
            'group',
            g.sourceCategoryId ?? null,
          ),
      )
      .filter((g) => g.name.length > 0);

    const [options, variants] = await Promise.all([
      this.optionRepo.findByItemId(id),
      this.variantRepo.findByItemId(id),
    ]);
    let resolvedOptions = options;
    if (normalized.some((g) => g.sourceCategoryId)) {
      const categories =
        (await this.categoryRepo?.findByRestaurantId(restaurantId)) ?? [];
      if (
        normalized.some(
          (g) =>
            g.sourceCategoryId &&
            !categories.some(
              (c) =>
                c.id === g.sourceCategoryId &&
                c.restaurantId === restaurantId &&
                c.isOptionSource,
            ),
        )
      ) {
        return err(
          new MenuItemOptionLimitError(
            'Elegí una categoría de opciones de este local.',
          ),
        );
      }
      const sources = await this.itemRepo.findByRestaurantId(restaurantId);
      resolvedOptions = resolveSharedMenuOptions(
        { ...existing, optionGroups: normalized },
        options,
        categories,
        sources,
      );
    }
    const error = validateOptionGroupConfiguration(
      normalized,
      variants,
      resolvedOptions,
    );
    if (error) return err(new MenuItemOptionLimitError(error));

    const updated = await this.itemRepo.update(id, {
      optionGroups: normalized,
    });
    if (!updated) return err(new MenuItemNotFoundError());
    return ok(updated);
  }
}
