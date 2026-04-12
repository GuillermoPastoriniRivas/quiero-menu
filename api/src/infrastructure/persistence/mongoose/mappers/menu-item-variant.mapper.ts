import { MenuItemVariant } from '../../../../domain/entities/menu-item-variant.entity.js';
import { MenuItemVariantDocument } from '../schemas/menu-item-variant.schema.js';

export class MenuItemVariantMapper {
  static toDomain(doc: MenuItemVariantDocument): MenuItemVariant {
    return new MenuItemVariant(
      doc._id.toHexString(),
      doc.itemId.toHexString(),
      doc.name,
      doc.priceOverride,
      doc.maxSelections,
      doc.displayOrder ?? 0,
    );
  }
}
