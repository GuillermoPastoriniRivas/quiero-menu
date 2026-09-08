import { OrderFeedback } from '../entities/order-feedback.entity.js';

export interface OrderFeedbackRepository {
  create(data: Omit<OrderFeedback, 'id' | 'createdAt'>): Promise<OrderFeedback>;
  findByOrderId(orderId: string): Promise<OrderFeedback | null>;
}
