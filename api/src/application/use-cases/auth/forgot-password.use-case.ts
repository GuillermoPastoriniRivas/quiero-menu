import { randomBytes, createHash } from 'crypto';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import type { EmailServicePort } from '../../ports/email-service.port.js';
import { passwordResetTemplate } from '../../../infrastructure/email/templates/password-reset.template.js';

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: VerificationTokenRepository,
    private readonly emailService: EmailServicePort,
    private readonly frontendUrl: string,
  ) {}

  async execute(email: string): Promise<void> {
    // Always return void to prevent email enumeration
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    await this.tokenRepo.deleteAllByUserId(user.id, 'password_reset');

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.tokenRepo.create({
      userId: user.id,
      tokenHash,
      type: 'password_reset',
      expiresAt,
    });

    const resetUrl = `${this.frontendUrl}/reset-password?token=${rawToken}`;
    await this.emailService.send({
      to: user.email,
      subject: 'Restablecé tu contraseña — quiero-menu',
      html: passwordResetTemplate(user.name, resetUrl),
    });
  }
}
