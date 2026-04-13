import { Restaurant } from '../../../../domain/entities/restaurant.entity.js';
import { RestaurantStatus } from '../../../../domain/enums/restaurant-status.enum.js';
import { RestaurantDocument } from '../schemas/restaurant.schema.js';

export class RestaurantMapper {
  static toDomain(doc: RestaurantDocument): Restaurant {
    return new Restaurant(
      doc._id.toHexString(),
      doc.slug,
      doc.name,
      doc.description,
      doc.logoUrl,
      doc.bannerUrl,
      doc.address,
      doc.city,
      doc.country,
      doc.coordinates,
      doc.phone,
      doc.timezone,
      doc.currency,
      doc.status as RestaurantStatus,
      doc.customDomain,
      doc.socialLinks ?? null,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
