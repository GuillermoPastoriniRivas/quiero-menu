import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { Result, ok, err } from '../../common/result.js';
import { RestaurantNotFoundError } from '../../../domain/errors/domain-errors.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';

export interface ImpersonationOutput {
  accessToken: string;
  refreshToken: string;
  impersonated: true;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    restaurantId: string;
    restaurantSlug: string;
  };
}

export class ImpersonateRestaurantOwnerUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  async execute(
    restaurantId: string,
  ): Promise<Result<ImpersonationOutput, RestaurantNotFoundError>> {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) return err(new RestaurantNotFoundError());

    const links =
      await this.userRestaurantRepo.findByRestaurantId(restaurantId);
    const ownerLink =
      links.find((l) => l.role === UserRole.OWNER) ?? links[0] ?? null;
    if (!ownerLink) return err(new RestaurantNotFoundError());

    const owner = await this.userRepo.findById(ownerLink.userId);
    if (!owner) return err(new RestaurantNotFoundError());

    // La sesión impersonada actúa COMO el dueño: sin claims de plataforma.
    const payload = {
      sub: owner.id,
      restaurantId: restaurant.id,
      role: ownerLink.role,
      imp: true,
    };

    const accessToken = this.tokenProvider.signAccess(payload);
    const refreshToken = this.tokenProvider.signRefresh(payload);

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({
      userId: owner.id,
      tokenHash,
      expiresAt,
    });

    return ok({
      accessToken,
      refreshToken,
      impersonated: true,
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: ownerLink.role,
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
      },
    });
  }
}
