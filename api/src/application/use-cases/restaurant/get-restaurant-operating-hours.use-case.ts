import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import { OperatingHours } from '../../../domain/entities/operating-hours.entity.js';
import { OperatingHoursPolicy } from '../../../domain/services/operating-hours-policy.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';

export interface RestaurantOperatingHoursData {
  hours: OperatingHours[];
  isOpen: boolean;
  todayHours: OperatingHours | null;
  localTime: string;
  closesAtLabel: string | null;
}

export class GetRestaurantOperatingHoursUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly hoursRepo: OperatingHoursRepository,
    private readonly hoursPolicy: OperatingHoursPolicy = new OperatingHoursPolicy(),
  ) {}

  async execute(
    restaurantId: string,
  ): Promise<Result<RestaurantOperatingHoursData, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const hours = await this.hoursRepo.findByRestaurantId(restaurantId);
    const openStatus = this.hoursPolicy.isOpen(restaurant, hours, new Date());

    return ok({
      hours,
      isOpen: openStatus.isOpen,
      todayHours: openStatus.todayHours,
      localTime: openStatus.localTime,
      closesAtLabel: openStatus.closesAtLabel,
    });
  }
}
