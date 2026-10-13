import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { OrderItemRepository } from '../../../domain/repositories/order-item.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { EmailServicePort } from '../../ports/email-service.port.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { newOrderTemplate } from '../../../infrastructure/email/templates/new-order.template.js';

/**
 * Aviso por email al dueño cuando entra un pedido nuevo. Se dispara
 * fire-and-forget desde el storefront. Respeta `notifyEmail` del usuario.
 * (Los avisos por WhatsApp son Pro y se enviarán cuando se conecte el
 * proveedor; acá solo se cubre el email, disponible en free y pro.)
 */
export class NotifyNewOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailServicePort,
    private readonly frontendUrl: string,
  ) {}

  async execute(orderId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return;

    const restaurant = await this.restaurantRepo.findById(order.restaurantId);
    if (!restaurant) return;

    const memberships = await this.userRestaurantRepo.findByRestaurantId(
      restaurant.id,
    );
    const ownerMembership = memberships.find((m) => m.role === UserRole.OWNER);
    if (!ownerMembership) return;

    const owner = await this.userRepo.findById(ownerMembership.userId);
    if (!owner || !owner.notifyEmail) return;

    const items = await this.orderItemRepo.findByOrderId(order.id);
    const itemsSummary =
      items.length > 0
        ? items
            .map((item) => {
              let line = `${item.quantity}x ${item.menuItemName}`;
              if (item.variantName) line += ` (${item.variantName})`;
              if (item.selectedOptions.length > 0)
                line += ` [${item.selectedOptions.map((o) => `${(o.quantity ?? 1) > 1 ? `${o.quantity}x ` : ''}${o.name}`).join(', ')}]`;
              for (const component of item.components ?? []) {
                line += `<br>&nbsp;&nbsp;${component.slotName}: ${component.quantity}x ${component.menuItemName}`;
                if (component.variantName)
                  line += ` (${component.variantName})`;
                if (component.selectedOptions.length)
                  line += ` [${component.selectedOptions.map((o) => `${(o.quantity ?? 1) > 1 ? `${o.quantity}x ` : ''}${o.name}`).join(', ')}]`;
              }
              return line;
            })
            .join('<br>')
        : 'Pedido sin detalle';

    const deliveryLabel =
      order.deliveryType === DeliveryType.DELIVERY
        ? `Delivery${order.customerAddress ? ` a ${order.customerAddress}` : ''}`
        : 'Retiro en tienda';

    await this.emailService.send({
      to: owner.email,
      subject: `Nuevo pedido #${order.code} — ${restaurant.name}`,
      html: newOrderTemplate(
        owner.name,
        order.code,
        order.customerName,
        itemsSummary,
        order.total,
        restaurant.currency,
        deliveryLabel,
        `${this.frontendUrl}/orders`,
      ),
    });
  }
}
