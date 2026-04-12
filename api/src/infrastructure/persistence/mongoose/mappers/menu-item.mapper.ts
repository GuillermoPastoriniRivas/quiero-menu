import { MenuItem } from '../../../../domain/entities/menu-item.entity.js';
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
    );
  }
}
