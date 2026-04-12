import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { DeliveryZone } from '../../../domain/entities/delivery-zone.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { DeliveryZoneNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class UpdateDeliveryZoneUseCase {
  constructor(private readonly zoneRepo: DeliveryZoneRepository) {}

  async execute(id: string, restaurantId: string, data: Partial<Omit<DeliveryZone, 'id' | 'restaurantId'>>): Promise<Result<DeliveryZone, DeliveryZoneNotFoundError | CrossRestaurantAccessError>> {
    const zone = await this.zoneRepo.findById(id);
    if (!zone) return err(new DeliveryZoneNotFoundError());
    if (zone.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const updated = await this.zoneRepo.update(id, data);
    if (!updated) return err(new DeliveryZoneNotFoundError());
    return ok(updated);
  }
}
