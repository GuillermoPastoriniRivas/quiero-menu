import { Order } from '../../../../domain/entities/order.entity.js';
import { OrderStatus } from '../../../../domain/enums/order-status.enum.js';
import { OrderSource } from '../../../../domain/enums/order-source.enum.js';
import { DeliveryType } from '../../../../domain/enums/delivery-type.enum.js';
import { OrderDocument } from '../schemas/order.schema.js';

export class OrderMapper {
  static toDomain(doc: OrderDocument): Order {
    return new Order(
      doc._id.toHexString(),
      doc.restaurantId.toHexString(),
      doc.code,
      doc.status as OrderStatus,
      doc.customerName,
      doc.customerPhone,
      doc.customerAddress,
      doc.customerLatitude ?? null,
      doc.customerLongitude ?? null,
      doc.deliveryType as DeliveryType,
      doc.deliveryZoneId?.toHexString() ?? null,
      doc.deliveryFee,
      doc.subtotal,
      doc.total,
      doc.paymentMethod,
      doc.receiptUrl ?? null,
      doc.notes,
      doc.source as OrderSource,
      doc.createdAt,
      doc.confirmedAt,
      doc.readyAt,
      doc.deliveredAt,
    );
  }
}
