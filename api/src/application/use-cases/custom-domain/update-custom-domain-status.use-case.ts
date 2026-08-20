import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { CustomDomainStatus } from '../../../domain/entities/restaurant.entity.js';

export class UpdateCustomDomainStatusUseCase {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async execute(
    restaurantId: string,
    state: NonNullable<CustomDomainStatus>['state'],
    failedReason?: string,
  ): Promise<Result<{ state: string }, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const current: NonNullable<CustomDomainStatus> =
      restaurant.customDomainStatus ?? {
        state: 'pending',
        requestedAt: new Date(),
      };
    const status: NonNullable<CustomDomainStatus> = {
      state,
      // Al volver a provisionar reiniciamos la ventana de "stale" (worker colgado).
      requestedAt:
        state === 'provisioning'
          ? new Date()
          : (current.requestedAt ?? new Date()),
      verifiedAt: state === 'active' ? new Date() : current.verifiedAt,
      failedReason: failedReason,
    };

    const updated = await this.restaurantRepo.update(restaurantId, {
      customDomainStatus: status,
    });
    if (!updated) return err(new RestaurantNotFoundError());
    return ok({ state });
  }
}
