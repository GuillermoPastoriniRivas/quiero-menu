import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { DeliveryZone } from '../../../domain/entities/delivery-zone.entity.js';

export class ListDeliveryZonesUseCase {
  constructor(private readonly zoneRepo: DeliveryZoneRepository) {}

  async execute(restaurantId: string): Promise<DeliveryZone[]> {
    return this.zoneRepo.findByRestaurantId(restaurantId);
  }
}
