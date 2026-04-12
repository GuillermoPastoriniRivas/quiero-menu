import { BillingRecord } from '../entities/billing-record.entity.js';

export interface BillingRecordRepository {
  create(data: Omit<BillingRecord, 'id' | 'createdAt'>): Promise<BillingRecord>;
  findByRestaurantId(restaurantId: string): Promise<BillingRecord[]>;
}
