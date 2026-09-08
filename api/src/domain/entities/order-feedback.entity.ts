export type OrderFeedbackRating = 'up' | 'down';

export class OrderFeedback {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly restaurantId: string,
    /** El comensal confirma la entrega: el oráculo de la facturación. */
    public readonly confirmedAt: Date,
    public readonly rating: OrderFeedbackRating | null,
    public readonly onTime: boolean | null,
    /** Cupón auto-generado como beneficio por confirmar (10% off). */
    public readonly couponCode: string | null,
    public readonly createdAt: Date,
  ) {}
}
