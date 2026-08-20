import { createHash } from 'crypto';
import { VerifyEmailUseCase } from './verify-email.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { VerificationToken } from '../../../domain/entities/verification-token.entity.js';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../../domain/errors/domain-errors.js';

describe('VerifyEmailUseCase', () => {
  function buildUseCase(
    overrides: {
      userRepo?: Partial<UserRepository>;
      tokenRepo?: Partial<VerificationTokenRepository>;
    } = {},
  ) {
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updatePasswordHash: jest.fn(),
      updateEmailVerified: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
    };
    const tokenRepo: VerificationTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      delete: jest.fn().mockResolvedValue(true),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
    };

    Object.assign(userRepo, overrides.userRepo);
    Object.assign(tokenRepo, overrides.tokenRepo);

    const useCase = new VerifyEmailUseCase(userRepo, tokenRepo);
    return { useCase, userRepo, tokenRepo };
  }

  const rawToken = 'raw-token';
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  it('marca el email como verificado y limpia los tokens', async () => {
    const token = new VerificationToken(
      't1',
      'u1',
      tokenHash,
      'email_verification',
      new Date(Date.now() + 3600000),
      new Date(),
    );
    const { useCase, userRepo, tokenRepo } = buildUseCase({
      tokenRepo: { findByTokenHash: jest.fn().mockResolvedValue(token) },
    });

    const result = await useCase.execute(rawToken);

    expect(result.ok).toBe(true);
    expect(tokenRepo.findByTokenHash).toHaveBeenCalledWith(
      tokenHash,
      'email_verification',
    );
    expect(userRepo.updateEmailVerified).toHaveBeenCalledWith('u1', true);
    expect(tokenRepo.deleteAllByUserId).toHaveBeenCalledWith(
      'u1',
      'email_verification',
    );
  });

  it('rechaza token inválido sin tocar el usuario', async () => {
    const { useCase, userRepo, tokenRepo } = buildUseCase({
      tokenRepo: { findByTokenHash: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute('token-invalido');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidTokenError);
    expect(userRepo.updateEmailVerified).not.toHaveBeenCalled();
    expect(tokenRepo.deleteAllByUserId).not.toHaveBeenCalled();
  });

  it('rechaza token expirado y lo borra', async () => {
    const token = new VerificationToken(
      't1',
      'u1',
      tokenHash,
      'email_verification',
      new Date(Date.now() - 1000),
      new Date(),
    );
    const { useCase, tokenRepo, userRepo } = buildUseCase({
      tokenRepo: { findByTokenHash: jest.fn().mockResolvedValue(token) },
    });

    const result = await useCase.execute(rawToken);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(TokenExpiredError);
    expect(tokenRepo.delete).toHaveBeenCalledWith('t1');
    expect(userRepo.updateEmailVerified).not.toHaveBeenCalled();
  });
});
