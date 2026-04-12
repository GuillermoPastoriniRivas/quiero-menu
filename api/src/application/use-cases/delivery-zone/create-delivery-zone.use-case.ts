import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { DeliveryZone } from '../../../domain/entities/delivery-zone.entity.js';
import { Result, ok } from '../../common/result.js';

export class CreateDeliveryZoneUseCase {
  constructor(private readonly zoneRepo: DeliveryZoneRepository) {}

  async execute(data: Omit<DeliveryZone, 'id'>): Promise<Result<DeliveryZone, never>> {
    const created = await this.zoneRepo.create(data);
    return ok(created);
  }
}
