import { createHash } from 'crypto';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import {
  TokenPayload,
  TokenProviderPort,
} from '../../ports/token-provider.port.js';
import { Result, ok, err } from '../../common/result.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors.js';
import { isPlatformAdminEmail } from '../../common/platform-admin.js';
import { User } from '../../../domain/entities/user.entity.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';

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
    private readonly platformAdminEmails: string[] = [],
    private readonly restaurantRepo: RestaurantRepository | null = null,
  ) {}

  async execute(
    token: string,
  ): Promise<Result<RefreshOutput, InvalidCredentialsError>> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!stored || stored.expiresAt < new Date()) {
      return err(new InvalidCredentialsError());
    }

    const user = await this.userRepo.findById(stored.userId);
    if (!user) return err(new InvalidCredentialsError());

    const previous = this.readPayload(token);
    const payload = previous?.act
      ? await this.operatingPayload(user, previous)
      : previous?.imp
        ? await this.impersonatedPayload(user, previous)
        : await this.ownPayload(user);
    if (!payload) return err(new InvalidCredentialsError());

    const accessToken = this.tokenProvider.signAccess(payload);
    const newRefreshToken = this.tokenProvider.signRefresh(payload);

    const newTokenHash = createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt,
    });

    await this.refreshTokenRepo.delete(stored.id);

    return ok({ accessToken, refreshToken: newRefreshToken });
  }

  private readPayload(token: string): TokenPayload | null {
    try {
      return this.tokenProvider.verifyRefresh(token) ?? null;
    } catch {
      return null;
    }
  }

  private async ownPayload(user: User): Promise<TokenPayload | null> {
    const userRestaurants = await this.userRestaurantRepo.findByUserId(user.id);
    if (userRestaurants.length === 0) return null;
    const primary = userRestaurants[0];
    return {
      sub: user.id,
      restaurantId: primary.restaurantId,
      role: primary.role,
      ...(this.isPlatformAdmin(user) ? { plat: true } : {}),
    };
  }

  private async operatingPayload(
    user: User,
    previous: TokenPayload,
  ): Promise<TokenPayload | null> {
    if (!this.isPlatformAdmin(user)) return null;
    if (this.restaurantRepo) {
      const restaurant = await this.restaurantRepo.findById(
        previous.restaurantId,
      );
      if (!restaurant) return null;
    }
    return {
      sub: user.id,
      restaurantId: previous.restaurantId,
      role: UserRole.OWNER,
      plat: true,
      act: true,
    };
  }

  private async impersonatedPayload(
    user: User,
    previous: TokenPayload,
  ): Promise<TokenPayload | null> {
    const link = await this.userRestaurantRepo.findByUserIdAndRestaurantId(
      user.id,
      previous.restaurantId,
    );
    if (!link) return this.ownPayload(user);
    return {
      sub: user.id,
      restaurantId: link.restaurantId,
      role: link.role,
      imp: true,
    };
  }

  private isPlatformAdmin(user: User): boolean {
    return isPlatformAdminEmail(user.email, this.platformAdminEmails);
  }
}
