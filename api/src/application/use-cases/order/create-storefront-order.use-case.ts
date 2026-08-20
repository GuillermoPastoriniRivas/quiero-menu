import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import { RealtimeGatewayPort } from '../../ports/realtime-gateway.port.js';
import { PushServicePort } from '../../ports/push-service.port.js';
import { OperatingHoursPolicy } from '../../../domain/services/operating-hours-policy.js';
import { Order } from '../../../domain/entities/order.entity.js';
import {
  OrderItem,
  SelectedOption,
} from '../../../domain/entities/order-item.entity.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { Result, ok, err } from '../../common/result.js';
import {
  RestaurantNotFoundError,
  RestaurantPausedError,
  RestaurantClosedError,
  MenuItemNotFoundError,
  CrossRestaurantAccessError,
  CouponInvalidError,
} from '../../../domain/errors/domain-errors.js';
import {
  isCouponApplicable,
  computeCouponDiscount,
} from '../../common/coupon-discount.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';

interface OrderItemInput {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  selectedOptionIds: string[];
  notes: string;
}

export interface CreateStorefrontOrderInput {
  items: OrderItemInput[];
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  deliveryType: DeliveryType;
  deliveryZoneId?: string;
  paymentMethod: string;
  receiptUrl?: string | null;
  couponCode?: string | null;
  notes: string;
}

export interface CreateStorefrontOrderOutput {
  order: Order;
  items: OrderItem[];
  whatsappUrl: string;
}

export class CreateStorefrontOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly hoursRepo: OperatingHoursRepository,
    private readonly menuItemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly zoneRepo: DeliveryZoneRepository,
    private readonly couponRepo: CouponRepository,
    private readonly gateway: RealtimeGatewayPort,
    private readonly pushService: PushServicePort,
    private readonly hoursPolicy: OperatingHoursPolicy = new OperatingHoursPolicy(),
  ) {}

  async execute(
    slug: string,
    input: CreateStorefrontOrderInput,
  ): Promise<
    Result<
      CreateStorefrontOrderOutput,
      | RestaurantNotFoundError
      | RestaurantPausedError
      | RestaurantClosedError
      | MenuItemNotFoundError
      | CrossRestaurantAccessError
      | CouponInvalidError
    >
  > {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());
    if (restaurant.status !== RestaurantStatus.ACTIVE)
      return err(new RestaurantPausedError());

    const hours = await this.hoursRepo.findByRestaurantId(restaurant.id);
    if (!this.hoursPolicy.isOpen(restaurant, hours, new Date()).isOpen)
      return err(new RestaurantClosedError());

    let deliveryFee = 0;
    if (input.deliveryType === DeliveryType.DELIVERY && input.deliveryZoneId) {
      const zone = await this.zoneRepo.findById(input.deliveryZoneId);
      if (zone) {
        if (zone.restaurantId !== restaurant.id)
          return err(new CrossRestaurantAccessError());
        deliveryFee = zone.price;
      }
    }

    const orderItemsData: Omit<OrderItem, 'id'>[] = [];
    let subtotal = 0;

    for (const itemInput of input.items) {
      const menuItem = await this.menuItemRepo.findById(itemInput.menuItemId);
      if (!menuItem || !menuItem.isAvailable || !menuItem.isVisible)
        return err(new MenuItemNotFoundError());
      if (menuItem.restaurantId !== restaurant.id)
        return err(new CrossRestaurantAccessError());

      let unitPrice = menuItem.basePrice;
      let variantName: string | null = null;

      if (itemInput.variantId) {
        const variant = await this.variantRepo.findById(itemInput.variantId);
        if (variant) {
          if (variant.priceOverride !== null) unitPrice = variant.priceOverride;
          variantName = variant.name;
        }
      }

      const selectedOptions: SelectedOption[] = [];
      for (const optionId of itemInput.selectedOptionIds) {
        const option = await this.optionRepo.findById(optionId);
        if (option) {
          unitPrice += option.priceDelta;
          selectedOptions.push({
            optionId: option.id,
            name: option.name,
            priceDelta: option.priceDelta,
          });
        }
      }

      const totalPrice = unitPrice * itemInput.quantity;
      subtotal += totalPrice;

      orderItemsData.push({
        orderId: '',
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        variantId: itemInput.variantId ?? null,
        variantName,
        quantity: itemInput.quantity,
        unitPrice,
        totalPrice,
        selectedOptions,
        notes: itemInput.notes,
      });
    }

    let discount = 0;
    let couponCode: string | null =
      input.couponCode?.trim().toUpperCase() || null;
    if (couponCode) {
      const coupon = await this.couponRepo.findByCode(
        restaurant.id,
        couponCode,
      );
      if (!coupon) return err(new CouponInvalidError('El cupon no existe.'));
      if (!isCouponApplicable(coupon, subtotal))
        return err(new CouponInvalidError('El cupon no aplica a este pedido.'));
      const applied = computeCouponDiscount(coupon, subtotal);
      if (applied.freeDelivery) {
        deliveryFee = 0;
      } else {
        discount = applied.discount;
      }
      couponCode = coupon.code;
    }

    const total = subtotal + deliveryFee - discount;
    const code = await this.orderRepo.generateNextCode(restaurant.id);

    const order = await this.orderRepo.create({
      restaurantId: restaurant.id,
      code,
      status: OrderStatus.NEW,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerAddress: input.customerAddress ?? null,
      customerLatitude: input.customerLatitude ?? null,
      customerLongitude: input.customerLongitude ?? null,
      deliveryType: input.deliveryType,
      deliveryZoneId: input.deliveryZoneId ?? null,
      deliveryFee,
      subtotal,
      discount,
      total,
      couponCode,
      paymentMethod: input.paymentMethod,
      receiptUrl: input.receiptUrl ?? null,
      notes: input.notes,
      source: OrderSource.STOREFRONT,
    });

    const itemsWithOrderId = orderItemsData.map((item) => ({
      ...item,
      orderId: order.id,
    }));
    const items = await this.orderItemRepo.createBulk(itemsWithOrderId);

    const messageLines = [
      `Hola! Quiero confirmar mi pedido (${code}):`,
      ...items.map((item) => {
        let line = `- ${item.quantity}x ${item.menuItemName}`;
        if (item.variantName) line += ` (${item.variantName})`;
        if (item.selectedOptions.length > 0) {
          line += ` [${item.selectedOptions.map((o) => o.name).join(', ')}]`;
        }
        return line;
      }),
    ];

    if (deliveryFee > 0)
      messageLines.push(`Envío: $${deliveryFee.toLocaleString()}`);
    if (discount > 0)
      messageLines.push(`Descuento: -$${discount.toLocaleString()}`);
    messageLines.push(`Total: $${total.toLocaleString()}`);

    if (input.deliveryType === DeliveryType.DELIVERY) {
      if (input.customerAddress)
        messageLines.push(`Dirección: ${input.customerAddress}`);
    } else {
      messageLines.push('Retiro en tienda');
    }

    const phone = restaurant.phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(messageLines.join('\n'));
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    // Realtime + push al staff del restaurante (fire-and-forget)
    this.gateway.emitToRestaurant(restaurant.id, 'order.updated', order);
    this.pushService
      .sendToRestaurant(restaurant.id, {
        title: `Nuevo pedido #${code}`,
        body: `${input.customerName} · ${items.reduce((s, it) => s + it.quantity, 0)} ítems · $${total.toLocaleString('es-AR')}`,
        url: '/orders',
        tag: `order-${order.id}`,
      })
      .catch(() => {});

    return ok({ order, items, whatsappUrl });
  }
}
