import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { Result, ok, err } from '../../common/result.js';
import { InvalidTokenError, TokenExpiredError } from '../../../domain/errors/domain-errors.js';

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: VerificationTokenRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<Result<void, InvalidTokenError | TokenExpiredError>> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const record = await this.tokenRepo.findByTokenHash(tokenHash, 'password_reset');

    if (!record) return err(new InvalidTokenError());
    if (record.isExpired) {
      await this.tokenRepo.delete(record.id);
      return err(new TokenExpiredError());
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepo.updatePasswordHash(record.userId, passwordHash);

    // Invalidate all tokens — force re-login
    await this.tokenRepo.deleteAllByUserId(record.userId, 'password_reset');
    await this.refreshTokenRepo.deleteAllByUserId(record.userId);

    return ok(undefined);
  }
}
