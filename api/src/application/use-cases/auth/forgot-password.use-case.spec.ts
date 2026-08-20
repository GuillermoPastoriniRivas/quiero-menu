import { createHash } from 'crypto';
import { ForgotPasswordUseCase } from './forgot-password.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { EmailServicePort } from '../../ports/email-service.port.js';
import { User } from '../../../domain/entities/user.entity.js';

describe('ForgotPasswordUseCase', () => {
  function buildUseCase(
    overrides: {
      userRepo?: Partial<UserRepository>;
      tokenRepo?: Partial<VerificationTokenRepository>;
      emailService?: Partial<EmailServicePort>;
    } = {},
  ) {
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest
        .fn()
        .mockResolvedValue(
          new User('u1', 'owner@test.com', 'hash', 'Owner', true, new Date()),
        ),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn(),
      delete: jest.fn(),
    };
    const tokenRepo: VerificationTokenRepository = {
      create: jest.fn().mockResolvedValue({} as never),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
    };
    const emailService: EmailServicePort = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    Object.assign(userRepo, overrides.userRepo);
    Object.assign(tokenRepo, overrides.tokenRepo);
    Object.assign(emailService, overrides.emailService);

    const useCase = new ForgotPasswordUseCase(
      userRepo,
      tokenRepo,
      emailService,
      'https://quiero.menu',
    );
    return { useCase, userRepo, tokenRepo, emailService };
  }

  it('crea token de reset de 30 minutos y envía el email con la URL', async () => {
    const { useCase, tokenRepo, emailService } = buildUseCase();

    await useCase.execute('owner@test.com');

    expect(tokenRepo.deleteAllByUserId).toHaveBeenCalledWith(
      'u1',
      'password_reset',
    );
    expect(tokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'password_reset' }),
    );
    const createCall = (tokenRepo.create as jest.Mock).mock.calls[0][0];
    expect(createCall.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      29 * 60 * 1000,
    );
    expect(createCall.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      30 * 60 * 1000,
    );

    expect(emailService.send).toHaveBeenCalledTimes(1);
    const sendCall = (emailService.send as jest.Mock).mock.calls[0][0];
    expect(sendCall.to).toBe('owner@test.com');
    expect(sendCall.html).toContain(
      'https://quiero.menu/reset-password?token=',
    );
    // El token en el email es el raw, no el hash.
    const rawToken = sendCall.html.match(/token=([a-f0-9]+)/)?.[1];
    expect(rawToken).toBeTruthy();
    expect(createHash('sha256').update(rawToken).digest('hex')).toBe(
      createCall.tokenHash,
    );
  });

  it('no envía email ni crea token cuando el email no existe (anti-enumeración)', async () => {
    const { useCase, tokenRepo, emailService } = buildUseCase({
      userRepo: { findByEmail: jest.fn().mockResolvedValue(null) },
    });

    await useCase.execute('nadie@test.com');

    expect(tokenRepo.create).not.toHaveBeenCalled();
    expect(emailService.send).not.toHaveBeenCalled();
  });
});
