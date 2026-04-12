import { OrderStatus } from '../enums/order-status.enum.js';
import { OrderSource } from '../enums/order-source.enum.js';
import { DeliveryType } from '../enums/delivery-type.enum.js';

export class Order {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly code: string,
    public readonly status: OrderStatus,
    public readonly customerName: string,
    public readonly customerPhone: string,
    public readonly customerAddress: string | null,
    public readonly deliveryType: DeliveryType,
    public readonly deliveryZoneId: string | null,
    public readonly deliveryFee: number,
    public readonly subtotal: number,
    public readonly total: number,
    public readonly paymentMethod: string,
    public readonly notes: string,
    public readonly source: OrderSource,
    public readonly createdAt: Date,
    public readonly confirmedAt: Date | null,
    public readonly readyAt: Date | null,
    public readonly deliveredAt: Date | null,
  ) {}
}
