import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { Order } from '../../../domain/entities/order.entity.js';
import { OrderItem, SelectedOption } from '../../../domain/entities/order-item.entity.js';
import { OrderStatus } from '../../../domain/enums/order-status.enum.js';
import { OrderSource } from '../../../domain/enums/order-source.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError, RestaurantPausedError, MenuItemNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';
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
    private readonly menuItemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly zoneRepo: DeliveryZoneRepository,
  ) {}

  async execute(slug: string, input: CreateStorefrontOrderInput): Promise<Result<CreateStorefrontOrderOutput, RestaurantNotFoundError | RestaurantPausedError | MenuItemNotFoundError | CrossRestaurantAccessError>> {
    const restaurant = await this.restaurantRepo.findBySlug(slug);
    if (!restaurant) return err(new RestaurantNotFoundError());
    if (restaurant.status !== RestaurantStatus.ACTIVE) return err(new RestaurantPausedError());

    let deliveryFee = 0;
    if (input.deliveryType === DeliveryType.DELIVERY && input.deliveryZoneId) {
      const zone = await this.zoneRepo.findById(input.deliveryZoneId);
      if (zone) {
        if (zone.restaurantId !== restaurant.id) return err(new CrossRestaurantAccessError());
        deliveryFee = zone.price;
      }
    }

    const orderItemsData: Omit<OrderItem, 'id'>[] = [];
    let subtotal = 0;

    for (const itemInput of input.items) {
      const menuItem = await this.menuItemRepo.findById(itemInput.menuItemId);
      if (!menuItem || !menuItem.isAvailable || !menuItem.isVisible) return err(new MenuItemNotFoundError());
      if (menuItem.restaurantId !== restaurant.id) return err(new CrossRestaurantAccessError());

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
          selectedOptions.push({ optionId: option.id, name: option.name, priceDelta: option.priceDelta });
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

    const total = subtotal + deliveryFee;
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
      total,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      source: OrderSource.STOREFRONT,
    });

    const itemsWithOrderId = orderItemsData.map((item) => ({ ...item, orderId: order.id }));
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

    if (deliveryFee > 0) messageLines.push(`Envío: $${deliveryFee.toLocaleString()}`);
    messageLines.push(`Total: $${total.toLocaleString()}`);

    if (input.deliveryType === DeliveryType.DELIVERY) {
      if (input.customerAddress) messageLines.push(`Dirección: ${input.customerAddress}`);
    } else {
      messageLines.push('Retiro en tienda');
    }

    const phone = restaurant.phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(messageLines.join('\n'));
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    return ok({ order, items, whatsappUrl });
  }
}
