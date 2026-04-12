import { BillingRecordRepository } from '../../../domain/repositories/billing-record.repository.js';
import { BillingRecord } from '../../../domain/entities/billing-record.entity.js';

export class GetBillingHistoryUseCase {
  constructor(private readonly billingRecordRepo: BillingRecordRepository) {}

  async execute(restaurantId: string): Promise<BillingRecord[]> {
    return this.billingRecordRepo.findByRestaurantId(restaurantId);
  }
}
