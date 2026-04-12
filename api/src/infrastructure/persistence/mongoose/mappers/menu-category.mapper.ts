import { MenuCategory } from '../../../../domain/entities/menu-category.entity.js';
import { MenuCategoryDocument } from '../schemas/menu-category.schema.js';

export class MenuCategoryMapper {
  static toDomain(doc: MenuCategoryDocument): MenuCategory {
    return new MenuCategory(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.name,
      doc.description,
      doc.displayOrder,
      doc.isVisible,
    );
  }
}
