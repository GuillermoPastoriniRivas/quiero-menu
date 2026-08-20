import { createHash, randomBytes } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import type { EmailServicePort } from '../../ports/email-service.port.js';
import { Result, ok, err } from '../../common/result.js';
import { UserNotFoundError } from '../../../domain/errors/domain-errors.js';
import { verifyEmailTemplate } from '../../../infrastructure/email/templates/verify-email.template.js';

export class ResendVerificationUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: VerificationTokenRepository,
    private readonly emailService: EmailServicePort,
    private readonly frontendUrl: string,
  ) {}

  async execute(userId: string): Promise<Result<void, UserNotFoundError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) return err(new UserNotFoundError());

    // Already verified — no-op to avoid leaking state
    if (user.emailVerified) return ok(undefined);

    await this.tokenRepo.deleteAllByUserId(userId, 'email_verification');

    const rawToken = randomBytes(32).toString('hex');
    const verificationHash = createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.tokenRepo.create({
      userId,
      tokenHash: verificationHash,
      type: 'email_verification',
      expiresAt,
    });

    const verifyUrl = `${this.frontendUrl}/verify-email?token=${rawToken}`;
    await this.emailService.send({
      to: user.email,
      subject: 'Verificá tu email — quiero-menu',
      html: verifyEmailTemplate(user.name, verifyUrl),
    });

    return ok(undefined);
  }
}
