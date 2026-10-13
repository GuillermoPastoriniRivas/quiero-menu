import { MenuItem } from '../../../../domain/entities/menu-item.entity.js';
import { MenuItemOptionGroup } from '../../../../domain/entities/menu-item-option-group.entity.js';
import { MenuItemType } from '../../../../domain/enums/menu-item-type.enum.js';
import { MenuItemDocument } from '../schemas/menu-item.schema.js';

export class MenuItemMapper {
  static toDomain(doc: MenuItemDocument): MenuItem {
    return new MenuItem(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.categoryId.toHexString(),
      doc.name,
      doc.description,
      doc.basePrice,
      doc.imageUrl,
      doc.displayOrder,
      doc.isAvailable,
      doc.isVisible,
      doc.itemType as MenuItemType,
      (doc.optionGroups ?? []).map(
        (g) =>
          new MenuItemOptionGroup(
            g.name,
            g.minSelections,
            g.maxSelections,
            g.variantId?.toHexString() ?? null,
            g.displayOrder,
            'group',
            g.sourceCategoryId?.toHexString() ?? null,
            g.groupId,
            g.selectionMode,
            g.requiredTotal ?? null,
            (g.optionPriceOverrides ?? []).map((override) => ({
              sourceItemId: override.sourceItemId.toHexString(),
              priceDelta: override.priceDelta,
            })),
          ),
      ),
      (doc.components ?? []).map((component) => ({
        slotId: component.slotId,
        name: component.name,
        displayOrder: component.displayOrder ?? 0,
        parentVariantId: component.parentVariantId?.toHexString() ?? null,
        quantity: component.quantity,
        choices: component.choices.map((choice) => ({
          menuItemId: choice.menuItemId.toHexString(),
          variantId: choice.variantId?.toHexString() ?? null,
          priceDelta: choice.priceDelta,
        })),
      })),
    );
  }
}
