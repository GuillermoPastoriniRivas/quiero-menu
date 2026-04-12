import { DeliveryZoneRepository } from '../../../domain/repositories/delivery-zone.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { DeliveryZoneNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class DeleteDeliveryZoneUseCase {
  constructor(private readonly zoneRepo: DeliveryZoneRepository) {}

  async execute(id: string, restaurantId: string): Promise<Result<void, DeliveryZoneNotFoundError | CrossRestaurantAccessError>> {
    const zone = await this.zoneRepo.findById(id);
    if (!zone) return err(new DeliveryZoneNotFoundError());
    if (zone.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    await this.zoneRepo.delete(id);
    return ok(undefined);
  }
}
