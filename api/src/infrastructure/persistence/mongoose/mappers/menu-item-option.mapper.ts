import { MenuItemOption } from '../../../../domain/entities/menu-item-option.entity.js';
import { MenuItemOptionDocument } from '../schemas/menu-item-option.schema.js';

export class MenuItemOptionMapper {
  static toDomain(doc: MenuItemOptionDocument): MenuItemOption {
    return new MenuItemOption(
      doc._id.toHexString(),
      doc.itemId.toHexString(),
      doc.variantId?.toHexString() ?? null,
      doc.name,
      doc.priceDelta,
      doc.optionGroup,
      doc.isAvailable,
    );
  }
}
