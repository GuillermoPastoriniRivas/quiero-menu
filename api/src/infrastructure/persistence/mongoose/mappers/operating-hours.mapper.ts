import { OperatingHours } from '../../../../domain/entities/operating-hours.entity.js';
import { OperatingHoursDocument } from '../schemas/operating-hours.schema.js';

export class OperatingHoursMapper {
  static toDomain(doc: OperatingHoursDocument): OperatingHours {
    return new OperatingHours(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.dayOfWeek,
      doc.opensAt,
      doc.closesAt,
      doc.isClosed,
    );
  }
}
