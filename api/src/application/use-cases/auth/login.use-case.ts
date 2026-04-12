import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { LoginInput } from '../../dtos/auth/login-input.dto.js';
import { LoginOutput } from '../../dtos/auth/login-output.dto.js';
import { Result, ok, err } from '../../common/result.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  async execute(input: LoginInput): Promise<Result<LoginOutput, InvalidCredentialsError>> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) return err(new InvalidCredentialsError());

    const valid = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!valid) return err(new InvalidCredentialsError());

    const userRestaurants = await this.userRestaurantRepo.findByUserId(user.id);
    if (userRestaurants.length === 0) return err(new InvalidCredentialsError());

    const primary = userRestaurants[0];
    const restaurant = await this.restaurantRepo.findById(primary.restaurantId);

    const payload = { sub: user.id, restaurantId: primary.restaurantId, role: primary.role };
    const accessToken = this.tokenProvider.signAccess(payload);
    const refreshToken = this.tokenProvider.signRefresh(payload);

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

    return ok({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: primary.role,
        restaurantId: primary.restaurantId,
        restaurantSlug: restaurant?.slug ?? '',
      },
    });
  }
}
