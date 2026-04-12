import { OrderItem } from '../../../../domain/entities/order-item.entity.js';
import { OrderItemDocument } from '../schemas/order-item.schema.js';

export class OrderItemMapper {
  static toDomain(doc: OrderItemDocument): OrderItem {
    return new OrderItem(
      doc._id.toHexString(),
      doc.orderId.toHexString(),
      doc.menuItemId.toHexString(),
      doc.menuItemName,
      doc.variantId?.toHexString() ?? null,
      doc.variantName,
      doc.quantity,
      doc.unitPrice,
      doc.totalPrice,
      doc.selectedOptions,
      doc.notes,
    );
  }
}
