import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { MenuItemOptionGroup } from '../../../domain/entities/menu-item-option-group.entity.js';
import type { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import type { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { effectiveGroupId, optionBelongsToGroup, validateOptionGroupConfiguration } from '../../../domain/services/menu-option-groups.js';
import type { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { resolveSharedMenuOptions } from '../../../domain/services/shared-menu-options.js';
import { Result, ok, err } from '../../common/result.js';
import {
  MenuItemNotFoundError,
  CrossRestaurantAccessError,
  MenuItemOptionLimitError,
} from '../../../domain/errors/domain-errors.js';

type OptionGroupInput = Omit<MenuItemOptionGroup, 'sourceCategoryId'> & { sourceCategoryId?: string | null };

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
    groups: OptionGroupInput[],
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

    const idsByName = new Map((existing.optionGroups ?? []).map((g) => [g.name, effectiveGroupId(g)]));
    for (const group of groups) if (group.groupId) idsByName.set(group.name.trim(), group.groupId);
    const normalized = groups
      .map((g, index) => {
        const general = groups.find((candidate) => candidate.variantId === null &&
          (candidate.groupId && g.groupId ? candidate.groupId === g.groupId : candidate.name.trim() === g.name.trim()));
        return new MenuItemOptionGroup(
            g.name.trim(),
            Math.max(0, Math.floor(g.minSelections || 0)),
            Math.max(0, Math.floor(g.maxSelections || 0)),
            g.variantId ?? null,
            g.displayOrder ?? index,
            'group',
            g.sourceCategoryId === undefined ? general?.sourceCategoryId ?? null : g.sourceCategoryId,
            g.groupId ?? idsByName.get(g.name.trim()) ?? effectiveGroupId({ name: g.name }),
            g.selectionMode ?? general?.selectionMode ?? 'multiple',
            g.requiredTotal !== undefined ? g.requiredTotal : general?.requiredTotal ?? null,
            g.optionPriceOverrides ?? general?.optionPriceOverrides ?? [],
          );
      })
      .filter((g) => g.name.length > 0);

    const [options, variants] = await Promise.all([
      this.optionRepo.findByItemId(id),
      this.variantRepo.findByItemId(id),
    ]);
    // Bind old local rows on save so a later group rename does not lose their identity.
    const boundOptions = options.map((option) => {
      const previous = existing.optionGroups?.find((g) => optionBelongsToGroup(option, g));
      const candidates = normalized.filter((g) => optionBelongsToGroup(option, g) ||
        (previous && effectiveGroupId(previous) === g.groupId));
      const group = candidates.find((g) => g.variantId === option.variantId) ?? candidates.find((g) => g.variantId === null);
      return group ? { ...option, groupId: group.groupId, optionGroup: group.name } : option;
    });
    let resolvedOptions = boundOptions;
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
        boundOptions,
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
    for (const option of boundOptions) {
      const previous = options.find((o) => o.id === option.id)!;
      if (option.groupId !== previous.groupId || option.optionGroup !== previous.optionGroup)
        await this.optionRepo.update(option.id, { groupId: option.groupId, optionGroup: option.optionGroup });
    }
    return ok(updated);
  }
}
