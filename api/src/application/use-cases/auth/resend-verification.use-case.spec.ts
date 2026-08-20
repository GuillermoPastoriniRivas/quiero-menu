import { createHash } from 'crypto';
import { ResendVerificationUseCase } from './resend-verification.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { EmailServicePort } from '../../ports/email-service.port.js';
import { User } from '../../../domain/entities/user.entity.js';

describe('ResendVerificationUseCase', () => {
  function buildUseCase(
    overrides: {
      userRepo?: Partial<UserRepository>;
      tokenRepo?: Partial<VerificationTokenRepository>;
      emailService?: Partial<EmailServicePort>;
    } = {},
  ) {
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest
        .fn()
        .mockResolvedValue(
          new User('u1', 'owner@test.com', 'hash', 'Owner', false, new Date()),
        ),
      findByEmail: jest.fn(),
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

    const useCase = new ResendVerificationUseCase(
      userRepo,
      tokenRepo,
      emailService,
      'https://quiero.menu',
    );
    return { useCase, userRepo, tokenRepo, emailService };
  }

  it('crea un token nuevo de 24 horas y envía el email de verificación', async () => {
    const { useCase, tokenRepo, emailService } = buildUseCase();

    await useCase.execute('u1');

    expect(tokenRepo.deleteAllByUserId).toHaveBeenCalledWith(
      'u1',
      'email_verification',
    );
    expect(tokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', type: 'email_verification' }),
    );
    const createCall = (tokenRepo.create as jest.Mock).mock.calls[0][0];
    expect(createCall.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      23 * 60 * 60 * 1000,
    );
    expect(createCall.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      24 * 60 * 60 * 1000,
    );

    expect(emailService.send).toHaveBeenCalledTimes(1);
    const sendCall = (emailService.send as jest.Mock).mock.calls[0][0];
    expect(sendCall.to).toBe('owner@test.com');
    expect(sendCall.html).toContain('https://quiero.menu/verify-email?token=');
    // El token en el email es el raw, no el hash.
    const rawToken = sendCall.html.match(/token=([a-f0-9]+)/)?.[1];
    expect(rawToken).toBeTruthy();
    expect(createHash('sha256').update(rawToken).digest('hex')).toBe(
      createCall.tokenHash,
    );
  });

  it('no crea token ni envía email si el email ya está verificado', async () => {
    const { useCase, tokenRepo, emailService } = buildUseCase({
      userRepo: {
        findById: jest
          .fn()
          .mockResolvedValue(
            new User('u1', 'owner@test.com', 'hash', 'Owner', true, new Date()),
          ),
      },
    });

    const result = await useCase.execute('u1');

    expect(result.ok).toBe(true);
    expect(tokenRepo.create).not.toHaveBeenCalled();
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it('devuelve error cuando el usuario no existe', async () => {
    const { useCase, tokenRepo, emailService } = buildUseCase({
      userRepo: { findById: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute('ghost');

    expect(result.ok).toBe(false);
    expect(tokenRepo.create).not.toHaveBeenCalled();
    expect(emailService.send).not.toHaveBeenCalled();
  });
});
