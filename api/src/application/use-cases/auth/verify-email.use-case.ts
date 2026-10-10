import { createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { Result, ok, err } from '../../common/result.js';
import type { BehaviorRecorder } from '../../ports/behavior.port.js';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../../domain/errors/domain-errors.js';

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: VerificationTokenRepository,
    private readonly behavior?: BehaviorRecorder,
  ) {}

  async execute(
    rawToken: string,
  ): Promise<Result<void, InvalidTokenError | TokenExpiredError>> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const record = await this.tokenRepo.findByTokenHash(
      tokenHash,
      'email_verification',
    );

    if (!record) return err(new InvalidTokenError());
    if (record.isExpired) {
      await this.tokenRepo.delete(record.id);
      return err(new TokenExpiredError());
    }

    await this.userRepo.updateEmailVerified(record.userId, true);
    await this.tokenRepo.deleteAllByUserId(record.userId, 'email_verification');
    this.behavior?.record('owner_email_verified', {
      actorUserId: record.userId,
      eventId: `verified:${record.userId}`,
    });

    return ok(undefined);
  }
}
