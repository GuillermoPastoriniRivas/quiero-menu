import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { LoginOutput } from '../../dtos/auth/login-output.dto.js';
import { Result, ok, err } from '../../common/result.js';
import {
  UserNotFoundError,
  InvalidCredentialsError,
} from '../../../domain/errors/domain-errors.js';
import { isPlatformAdminEmail } from '../../common/platform-admin.js';

export class SetPasswordUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenProvider: TokenProviderPort,
    private readonly platformAdminEmails: string[] = [],
  ) {}

  async execute(
    userId: string,
    password: string,
    currentPassword?: string,
  ): Promise<Result<LoginOutput, UserNotFoundError | InvalidCredentialsError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return err(new UserNotFoundError());

    if (user.passwordHash !== '') {
      if (!currentPassword) return err(new InvalidCredentialsError());
      const valid = await this.passwordHasher.verify(
        currentPassword,
        user.passwordHash,
      );
      if (!valid) return err(new InvalidCredentialsError());
    }

    const hash = await this.passwordHasher.hash(password);
    await this.userRepo.updatePasswordHash(userId, hash);
    await this.refreshTokenRepo.deleteAllByUserId(userId);

    const userRestaurants = await this.userRestaurantRepo.findByUserId(userId);
    if (userRestaurants.length === 0) return err(new UserNotFoundError());

    const primary = userRestaurants[0];
    const restaurant = await this.restaurantRepo.findById(primary.restaurantId);

    const platformAdmin = isPlatformAdminEmail(
      user.email,
      this.platformAdminEmails,
    );

    const payload = {
      sub: user.id,
      restaurantId: primary.restaurantId,
      role: primary.role,
      ...(platformAdmin ? { plat: true } : {}),
    };
    const accessToken = this.tokenProvider.signAccess(payload);
    const refreshToken = this.tokenProvider.signRefresh(payload);

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });

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
        ...(platformAdmin ? { platformAdmin: true } : {}),
      },
    });
  }
}
