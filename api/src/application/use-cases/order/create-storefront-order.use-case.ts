import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { CouponRepository } from '../../../domain/repositories/coupon.repository.js';
import { RealtimeGatewayPort } from '../../ports/realtime-gateway.port.js';
import { PushServicePort } from '../../ports/push-service.port.js';
import { OperatingHoursPolicy } from '../../../domain/services/operating-hours-policy.js';
import type { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { resolveSharedMenuOptions } from '../../../domain/services/shared-menu-options.js';
import { resolveMenuSelection, type SelectedOptionInput } from '../../../domain/services/menu-selection.js';
import { componentsForVariant, validateMenuComponents } from '../../../domain/services/menu-components.js';
import { Order } from '../../../domain/entities/order.entity.js';
import type { BehaviorContext } from '../../../domain/entities/behavior-event.entity.js';
import {
  OrderItem,
  OrderItemComponent,
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
  MenuItemOptionLimitError,
} from '../../../domain/errors/domain-errors.js';
import {
  isCouponApplicable,
  computeCouponDiscount,
} from '../../common/coupon-discount.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import {
  generateTrackingToken,
  normalizeTrackingToken,
} from '../../common/generate-tracking-token.js';

interface OrderItemInput {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  selectedOptionIds?: string[];
  selectedOptions?: SelectedOptionInput[];
  components?: {
    slotId: string;
    menuItemId: string;
    variantId?: string;
    selectedOptions?: SelectedOptionInput[];
  }[];
  notes: string;
}

export interface CreateStorefrontOrderInput {
  attribution?: BehaviorContext;
  items: OrderItemInput[];
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  deliveryType: DeliveryType;
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
    private readonly couponRepo: CouponRepository,
    private readonly gateway: RealtimeGatewayPort,
    private readonly pushService: PushServicePort,
    private readonly hoursPolicy: OperatingHoursPolicy = new OperatingHoursPolicy(),
    private readonly categoryRepo?: MenuCategoryRepository,
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
      | MenuItemOptionLimitError
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

    const orderItemsData: Omit<OrderItem, 'id'>[] = [];
    let subtotal = 0;
    const categories =
      (await this.categoryRepo?.findByRestaurantId(restaurant.id)) ?? [];
    let sourceItems:
      | Awaited<ReturnType<MenuItemRepository['findByRestaurantId']>>
      | undefined;

    for (const itemInput of input.items) {
      if (!Number.isSafeInteger(itemInput.quantity) || itemInput.quantity < 1)
        return err(new MenuItemOptionLimitError('La cantidad del producto debe ser un entero positivo.'));
      const menuItem = await this.menuItemRepo.findById(itemInput.menuItemId);
      if (!menuItem || !menuItem.isAvailable || !menuItem.isVisible)
        return err(new MenuItemNotFoundError());
      if (menuItem.restaurantId !== restaurant.id)
        return err(new CrossRestaurantAccessError());
      if (categories.some((c) => c.id === menuItem.categoryId && !c.isVisible))
        return err(new MenuItemNotFoundError());
      if (
        categories.some((c) => c.id === menuItem.categoryId && c.isOptionSource)
      )
        return err(
          new MenuItemOptionLimitError(
            'Los sabores se eligen dentro de un producto. Elegí un pote para continuar.',
          ),
        );

      let unitPrice = menuItem.basePrice;
      let variantName: string | null = null;

      const [variants, localOptions] = await Promise.all([
        this.variantRepo.findByItemId(menuItem.id),
        this.optionRepo.findByItemId(menuItem.id),
      ]);
      if (menuItem.optionGroups?.some((g) => g.sourceCategoryId))
        sourceItems ??= await this.menuItemRepo.findByRestaurantId(
          restaurant.id,
        );
      const variantId = itemInput.variantId ?? null;
      const options = resolveSharedMenuOptions(
        menuItem,
        localOptions,
        categories,
        sourceItems ?? [],
        variantId,
      );
      const variant = variants.find((v) => v.id === variantId);
      if (
        (variants.length > 0 && !variant) ||
        (variantId !== null && !variant) || variant?.isAvailable === false
      ) {
        return err(
          new MenuItemOptionLimitError(
            `"${menuItem.name}": elegí un tamaño disponible.`,
          ),
        );
      }
      if (variant) {
        unitPrice = variant.priceOverride ?? menuItem.basePrice;
        variantName = variant.name;
      }
      const selection = resolveMenuSelection(menuItem, variants, options, variantId, itemInput);
      if (typeof selection === 'string') return err(new MenuItemOptionLimitError(`"${menuItem.name}": ${selection}`));
      const selectedOptions = selection.selectedOptions;
      unitPrice += selection.priceDelta;

      const components: OrderItemComponent[] = [];
      const slots = componentsForVariant(menuItem.components ?? [], variantId);
      const requested = itemInput.components ?? [];
      if (requested.length !== slots.length || new Set(requested.map((c) => c.slotId)).size !== requested.length ||
        requested.some((c) => !slots.some((slot) => slot.slotId === c.slotId)))
        return err(new MenuItemOptionLimitError('Completá cada componente de la promo, sin slots repetidos o ajenos.'));
      if (slots.length) {
        sourceItems ??= await this.menuItemRepo.findByRestaurantId(restaurant.id);
        const componentVariants = await this.variantRepo.findByItemIds(sourceItems.map((item) => item.id));
        const configError = validateMenuComponents(menuItem, slots, categories, sourceItems, componentVariants);
        if (configError) return err(new MenuItemOptionLimitError(configError));
        for (const slot of slots) {
          const componentInput = requested.find((c) => c.slotId === slot.slotId)!;
          const choice = slot.choices.find((c) => c.menuItemId === componentInput.menuItemId && c.variantId === (componentInput.variantId ?? null));
          if (!choice) return err(new MenuItemOptionLimitError(`Elegí un producto y presentación válidos en "${slot.name}".`));
          const componentItem = sourceItems.find((item) => item.id === choice.menuItemId)!;
          const componentCategory = categories.find((c) => c.id === componentItem.categoryId)!;
          const childVariants = componentVariants.filter((v) => v.itemId === componentItem.id);
          const childVariant = childVariants.find((v) => v.id === choice.variantId);
          if (!componentItem.isAvailable || !componentItem.isVisible || !componentCategory.isVisible || childVariant?.isAvailable === false)
            return err(new MenuItemOptionLimitError(`"${slot.name}": el producto o presentación ya no está disponible.`));
          const childOptions = resolveSharedMenuOptions(componentItem,
            await this.optionRepo.findByItemId(componentItem.id), categories, sourceItems, choice.variantId);
          const childSelection = resolveMenuSelection(componentItem, childVariants, childOptions, choice.variantId, componentInput);
          if (typeof childSelection === 'string') return err(new MenuItemOptionLimitError(`"${slot.name}": ${childSelection}`));
          unitPrice += slot.quantity * (choice.priceDelta + childSelection.priceDelta);
          components.push({
            slotId: slot.slotId, slotName: slot.name, quantity: slot.quantity,
            menuItemId: componentItem.id, menuItemName: componentItem.name,
            variantId: choice.variantId, variantName: childVariant?.name ?? null,
            priceDelta: choice.priceDelta, selectedOptions: childSelection.selectedOptions,
          });
        }
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(unitPrice * itemInput.quantity))
        return err(new MenuItemOptionLimitError('El precio final del producto no es válido.'));

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
        components,
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

    let trackingToken = generateTrackingToken();
    while (await this.orderRepo.findByTrackingToken(trackingToken)) {
      trackingToken = generateTrackingToken();
    }

    const order = await this.orderRepo.create({
      restaurantId: restaurant.id,
      code,
      trackingToken: normalizeTrackingToken(trackingToken),
      status: OrderStatus.NEW,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerAddress: input.customerAddress ?? null,
      customerLatitude: input.customerLatitude ?? null,
      customerLongitude: input.customerLongitude ?? null,
      deliveryType: input.deliveryType,
      deliveryFee,
      subtotal,
      discount,
      total,
      couponCode,
      paymentMethod: input.paymentMethod,
      receiptUrl: input.receiptUrl ?? null,
      notes: input.notes,
      source: OrderSource.STOREFRONT,
      attribution: input.attribution ?? null,
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
          line += ` [${item.selectedOptions.map((o) => `${o.quantity ?? 1}x ${o.name}`).join(', ')}]`;
        }
        for (const component of item.components ?? []) {
          line += `\n  ${component.slotName}: ${component.quantity}x ${component.menuItemName}`;
          if (component.variantName) line += ` (${component.variantName})`;
          if (component.selectedOptions.length)
            line += ` [${component.selectedOptions.map((o) => `${o.quantity ?? 1}x ${o.name}`).join(', ')}]`;
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
