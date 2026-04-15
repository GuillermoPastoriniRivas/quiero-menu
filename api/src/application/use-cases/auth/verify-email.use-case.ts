import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { InvalidTokenError, TokenExpiredError } from '../../../domain/errors/domain-errors.js';

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: VerificationTokenRepository,
  ) {}

  async execute(rawToken: string): Promise<Result<void, InvalidTokenError | TokenExpiredError>> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const record = await this.tokenRepo.findByTokenHash(tokenHash, 'email_verification');

    if (!record) return err(new InvalidTokenError());
    if (record.isExpired) {
      await this.tokenRepo.delete(record.id);
      return err(new TokenExpiredError());
    }

    await this.userRepo.updateEmailVerified(record.userId, true);
    await this.tokenRepo.deleteAllByUserId(record.userId, 'email_verification');

    return ok(undefined);
  }
}
