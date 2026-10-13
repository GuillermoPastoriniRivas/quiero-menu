import { MenuItemOption } from '../entities/menu-item-option.entity.js';
import type { MenuItem } from '../entities/menu-item.entity.js';
import type { MenuCategory } from '../entities/menu-category.entity.js';
import {
  effectiveGroupId,
  inheritOptionGroup,
  optionBelongsToGroup,
  optionGroupName,
  sameOptionGroup,
} from './menu-option-groups.js';

/** Read the current source once; no duplicated flavor inventory to synchronize. */
export function resolveSharedMenuOptions(
  item: MenuItem,
  localOptions: MenuItemOption[],
  categories: MenuCategory[],
  sourceItems: MenuItem[],
  variantId?: string | null,
): MenuItemOption[] {
  const configured = (item.optionGroups ?? []).map((g) =>
    inheritOptionGroup(g, item.optionGroups ?? []),
  );
  const rules = configured.filter(
    (g) =>
      g.sourceCategoryId &&
      (variantId === undefined ||
        g.variantId === variantId ||
        (g.variantId === null &&
          !configured.some(
            (specific) =>
              sameOptionGroup(specific, g) && specific.variantId === variantId,
          ))),
  );
  const options: MenuItemOption[] = localOptions
    .filter(
      (o) =>
        !rules.some(
          (g) =>
            optionBelongsToGroup(o, g) &&
            (g.variantId === null || g.variantId === o.variantId),
        ),
    )
    .map((option) => {
      const rule =
        configured.find(
          (g) =>
            g.variantId === (variantId ?? option.variantId) &&
            optionBelongsToGroup(option, g),
        ) ??
        configured.find(
          (g) => g.variantId === null && optionBelongsToGroup(option, g),
        );
      return {
        ...option,
        groupId: effectiveGroupId(
          rule ?? { name: optionGroupName(option), groupId: option.groupId },
        ),
      };
    });
  for (const rule of rules) {
    const source = categories.find(
      (c) =>
        c.id === rule.sourceCategoryId &&
        c.restaurantId === item.restaurantId &&
        c.isOptionSource,
    );
    if (!source) continue;
    for (const flavor of sourceItems) {
      if (
        flavor.categoryId !== source.id ||
        flavor.restaurantId !== item.restaurantId ||
        !flavor.isVisible ||
        flavor.id === item.id
      )
        continue;
      options.push(
        new MenuItemOption(
          `source:${flavor.id}:${encodeURIComponent(rule.name)}:${rule.variantId ?? 'all'}`,
          item.id,
          rule.variantId,
          flavor.name,
          rule.optionPriceOverrides?.find(
            (override) => override.sourceItemId === flavor.id,
          )?.priceDelta ??
            flavor.basePrice ??
            0,
          rule.name,
          flavor.isAvailable,
          undefined,
          flavor.id,
          flavor.description,
          effectiveGroupId(rule),
        ),
      );
    }
  }
  return options;
}
