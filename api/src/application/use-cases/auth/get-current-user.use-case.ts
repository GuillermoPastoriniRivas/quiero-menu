import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { UserNotFoundError } from '../../../domain/errors/domain-errors.js';
import { isPlatformAdminEmail } from '../../common/platform-admin.js';

export interface CurrentUserOutput {
  id: string;
  name: string;
  email: string;
  restaurants: { id: string; slug: string; name: string; role: string }[];
  platformAdmin?: boolean;
}

export class GetCurrentUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly platformAdminEmails: string[] = [],
  ) {}

  async execute(
    userId: string,
  ): Promise<Result<CurrentUserOutput, UserNotFoundError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return err(new UserNotFoundError());

    const userRestaurants = await this.userRestaurantRepo.findByUserId(userId);
    const restaurants = await Promise.all(
      userRestaurants.map(async (ur) => {
        const r = await this.restaurantRepo.findById(ur.restaurantId);
        return {
          id: ur.restaurantId,
          slug: r?.slug ?? '',
          name: r?.name ?? '',
          role: ur.role,
        };
      }),
    );

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      restaurants,
      ...(isPlatformAdminEmail(user.email, this.platformAdminEmails)
        ? { platformAdmin: true }
        : {}),
    });
  }
}
