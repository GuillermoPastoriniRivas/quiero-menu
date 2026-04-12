import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';

export class UpdateOperatingHoursUseCase {
  constructor(private readonly hoursRepo: OperatingHoursRepository) {}

  async execute(restaurantId: string, hours: Omit<OperatingHours, 'id' | 'restaurantId'>[]): Promise<OperatingHours[]> {
    return this.hoursRepo.upsertBulk(restaurantId, hours);
  }
}
