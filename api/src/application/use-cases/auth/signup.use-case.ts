import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import { UserRestaurantRepository } from '../../../domain/repositories/user-restaurant.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { TokenProviderPort } from '../../ports/token-provider.port.js';
import { SignupInput } from '../../dtos/auth/signup-input.dto.js';
import { LoginOutput } from '../../dtos/auth/login-output.dto.js';
import { Result, ok, err } from '../../common/result.js';
import { EmailAlreadyExistsError, SlugAlreadyExistsError } from '../../../domain/errors/domain-errors.js';
import { RestaurantStatus } from '../../../domain/enums/restaurant-status.enum.js';
import { UserRole } from '../../../domain/enums/user-role.enum.js';

export class SignupUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly restaurantRepo: RestaurantRepository,
    private readonly userRestaurantRepo: UserRestaurantRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenProvider: TokenProviderPort,
  ) {}

  async execute(input: SignupInput): Promise<Result<LoginOutput, EmailAlreadyExistsError | SlugAlreadyExistsError>> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) return err(new EmailAlreadyExistsError());

    const existingSlug = await this.restaurantRepo.findBySlug(input.restaurantSlug);
    if (existingSlug) return err(new SlugAlreadyExistsError());

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const restaurant = await this.restaurantRepo.create({
      slug: input.restaurantSlug,
      name: input.restaurantName,
      description: '',
      logoUrl: '',
      bannerUrl: '',
      address: '',
      city: '',
      country: '',
      coordinates: null,
      phone: '',
      timezone: 'America/Bogota',
      currency: 'COP',
      status: RestaurantStatus.ACTIVE,
      customDomain: null,
    });

    await this.userRestaurantRepo.create({
      userId: user.id,
      restaurantId: restaurant.id,
      role: UserRole.OWNER,
    });

    const payload = { sub: user.id, restaurantId: restaurant.id, role: UserRole.OWNER };
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
        role: UserRole.OWNER,
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
      },
    });
  }
}
