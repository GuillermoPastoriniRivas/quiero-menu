import { UserRestaurant } from '../../../../domain/entities/user-restaurant.entity.js';
import { UserRole } from '../../../../domain/enums/user-role.enum.js';
import { UserRestaurantDocument } from '../schemas/user-restaurant.schema.js';

export class UserRestaurantMapper {
  static toDomain(doc: UserRestaurantDocument): UserRestaurant {
    return new UserRestaurant(
      doc._id.toHexString(),
      doc.userId.toHexString(),
      doc.restaurantId.toHexString(),
      doc.role as UserRole,
    );
  }
}
