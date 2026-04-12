import { DeliveryZone } from '../../../../domain/entities/delivery-zone.entity.js';
import { DeliveryZoneDocument } from '../schemas/delivery-zone.schema.js';

export class DeliveryZoneMapper {
  static toDomain(doc: DeliveryZoneDocument): DeliveryZone {
    return new DeliveryZone(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.name,
      doc.price,
      doc.estimatedMinutes,
      doc.isActive,
    );
  }
}
