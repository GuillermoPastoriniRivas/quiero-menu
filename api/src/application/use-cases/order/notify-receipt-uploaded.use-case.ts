import { OrderRepository } from '../../../domain/repositories/order.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { EmailServicePort } from '../../ports/email-service.port.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';
import { receiptUploadedTemplate } from '../../../infrastructure/email/templates/receipt-uploaded.template.js';

export class NotifyReceiptUploadedUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailServicePort,
    private readonly frontendUrl: string,
  ) {}

  async execute(orderId: string, receiptUrl: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return;

    const restaurant = await this.restaurantRepo.findById(order.restaurantId);
    if (!restaurant) return;

    const memberships = await this.userRestaurantRepo.findByRestaurantId(restaurant.id);
    const ownerMembership = memberships.find((m) => m.role === UserRole.OWNER);
    if (!ownerMembership) return;

    const owner = await this.userRepo.findById(ownerMembership.userId);
    if (!owner) return;

    const dashboardUrl = `${this.frontendUrl}/orders`;

    await this.emailService.send({
      to: owner.email,
      subject: `Comprobante recibido — Pedido #${order.code}`,
      html: receiptUploadedTemplate(
        owner.name,
        order.code,
        order.customerName,
        order.total,
        restaurant.currency,
        receiptUrl,
        dashboardUrl,
      ),
    });
  }
}
