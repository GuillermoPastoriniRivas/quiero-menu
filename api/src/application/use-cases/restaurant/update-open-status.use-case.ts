import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { Restaurant } from '../../../domain/entities/restaurant.entity.js';
import { OperatingHoursPolicy } from '../../../domain/services/operating-hours-policy.js';
import { RealtimeGatewayPort } from '../../ports/realtime-gateway.port.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

/**
 * Toggle manual del panel: `open` es el estado que el dueño quiere AHORA.
 * El policy decide si hace falta un override (open/closed) o si el horario
 * ya da ese resultado (null => auto).
 */
export class UpdateOpenStatusUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly hoursRepo: OperatingHoursRepository,
    private readonly gateway: RealtimeGatewayPort,
    private readonly hoursPolicy: OperatingHoursPolicy = new OperatingHoursPolicy(),
  ) {}

  async execute(
    restaurantId: string,
    open: boolean,
  ): Promise<Result<Restaurant, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const hours = await this.hoursRepo.findByRestaurantId(restaurantId);
    const openOverride = this.hoursPolicy.computeOverride(
      restaurant,
      hours,
      new Date(),
      open,
    );

    const updated = await this.restaurantRepo.update(restaurantId, {
      openOverride,
    });
    if (!updated) return err(new RestaurantNotFoundError());

    this.gateway.emitToRestaurant(restaurantId, 'restaurant.updated', {
      status: updated.status,
      openOverride: updated.openOverride,
    });

    return ok(updated);
  }
}
