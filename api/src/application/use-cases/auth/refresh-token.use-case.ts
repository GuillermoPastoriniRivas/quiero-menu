import { createHash } from 'crypto';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { Result, ok, err } from '../../common/result.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';

export interface RefreshOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  async execute(token: string): Promise<Result<RefreshOutput, InvalidCredentialsError>> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      return err(new InvalidCredentialsError());
    }

    const user = await this.userRepo.findById(stored.userId);
    if (!user) return err(new InvalidCredentialsError());

    const userRestaurants = await this.userRestaurantRepo.findByUserId(user.id);
    if (userRestaurants.length === 0) return err(new InvalidCredentialsError());

    const primary = userRestaurants[0];

    const payload = { sub: user.id, restaurantId: primary.restaurantId, role: primary.role };
    const accessToken = this.tokenProvider.signAccess(payload);
    const newRefreshToken = this.tokenProvider.signRefresh(payload);

    const newTokenHash = createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({ userId: user.id, tokenHash: newTokenHash, expiresAt });

    await this.refreshTokenRepo.delete(stored.id);

    return ok({ accessToken, refreshToken: newRefreshToken });
  }
}
