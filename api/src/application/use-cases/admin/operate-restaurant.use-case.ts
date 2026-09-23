import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { Result, ok, err } from '../../common/result.js';
import { issueSession } from '../../common/session-tokens.js';
import {
  RestaurantNotFoundError,
  UserNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';

export interface OperateRestaurantOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    restaurantId: string;
    restaurantSlug: string;
    restaurantName: string;
    platformAdmin: true;
    operating: true;
  };
}

export class OperateRestaurantUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  async execute(
    adminUserId: string,
    restaurantId: string,
  ): Promise<
    Result<OperateRestaurantOutput, RestaurantNotFoundError | UserNotFoundError>
  > {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const admin = await this.userRepo.findById(adminUserId);
    if (!admin) return err(new UserNotFoundError());

    const session = await issueSession(
      this.tokenProvider,
      this.refreshTokenRepo,
      {
        sub: admin.id,
        restaurantId: restaurant.id,
        role: UserRole.OWNER,
        plat: true,
        act: true,
      },
    );

    return ok({
      ...session,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: UserRole.OWNER,
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        restaurantName: restaurant.name,
        platformAdmin: true,
        operating: true,
      },
    });
  }
}
