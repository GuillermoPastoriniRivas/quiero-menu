import { OperatingHours } from '../entities/operating-hours.entity.js';

export interface OperatingHoursRepository {
  findByRestaurantId(restaurantId: string): Promise<OperatingHours[]>;
  upsertBulk(restaurantId: string, hours: Omit<OperatingHours, 'id' | 'restaurantId'>[]): Promise<OperatingHours[]>;
  deleteByRestaurantId(restaurantId: string): Promise<void>;
}
