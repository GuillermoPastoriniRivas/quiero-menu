import { createHash } from 'crypto';
import { ResetPasswordUseCase } from './reset-password.use-case.js';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { VerificationTokenRepository } from '../../../domain/repositories/verification-token.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import { VerificationToken } from '../../../domain/entities/verification-token.entity.js';
import {
  InvalidTokenError,
  TokenExpiredError,
} from '../../../domain/errors/domain-errors.js';

describe('ResetPasswordUseCase', () => {
  function buildUseCase(
    overrides: {
      userRepo?: Partial<UserRepository>;
      tokenRepo?: Partial<VerificationTokenRepository>;
      refreshTokenRepo?: Partial<RefreshTokenRepository>;
      passwordHasher?: Partial<PasswordHasherPort>;
    } = {},
  ) {
    const userRepo: UserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updatePasswordHash: jest.fn().mockResolvedValue(null),
      updateEmailVerified: jest.fn(),
      delete: jest.fn(),
    };
    const tokenRepo: VerificationTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
    };
    const refreshTokenRepo: RefreshTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
    };
    const passwordHasher: PasswordHasherPort = {
      hash: jest.fn().mockResolvedValue('nuevo-hash'),
      verify: jest.fn(),
    };

    Object.assign(userRepo, overrides.userRepo);
    Object.assign(tokenRepo, overrides.tokenRepo);
    Object.assign(refreshTokenRepo, overrides.refreshTokenRepo);
    Object.assign(passwordHasher, overrides.passwordHasher);

    const useCase = new ResetPasswordUseCase(
      userRepo,
      tokenRepo,
      refreshTokenRepo,
      passwordHasher,
    );
    return { useCase, userRepo, tokenRepo, refreshTokenRepo, passwordHasher };
  }

  const rawToken = 'raw-token';
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  it('actualiza el password e invalida todas las sesiones', async () => {
    const token = new VerificationToken(
      't1',
      'u1',
      tokenHash,
      'password_reset',
      new Date(Date.now() + 3600000),
      new Date(),
    );
    const { useCase, userRepo, tokenRepo, refreshTokenRepo, passwordHasher } =
      buildUseCase({
        tokenRepo: { findByTokenHash: jest.fn().mockResolvedValue(token) },
      });

    const result = await useCase.execute(rawToken, 'nuevo-password');

    expect(result.ok).toBe(true);
    expect(passwordHasher.hash).toHaveBeenCalledWith('nuevo-password');
    expect(userRepo.updatePasswordHash).toHaveBeenCalledWith(
      'u1',
      'nuevo-hash',
    );
    expect(tokenRepo.deleteAllByUserId).toHaveBeenCalledWith(
      'u1',
      'password_reset',
    );
    expect(refreshTokenRepo.deleteAllByUserId).toHaveBeenCalledWith('u1');
  });

  it('rechaza token inválido', async () => {
    const { useCase, userRepo } = buildUseCase({
      tokenRepo: { findByTokenHash: jest.fn().mockResolvedValue(null) },
    });

    const result = await useCase.execute('token-invalido', 'nuevo-password');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(InvalidTokenError);
    expect(userRepo.updatePasswordHash).not.toHaveBeenCalled();
  });

  it('rechaza token expirado y lo borra', async () => {
    const token = new VerificationToken(
      't1',
      'u1',
      tokenHash,
      'password_reset',
      new Date(Date.now() - 1000),
      new Date(),
    );
    const { useCase, tokenRepo, userRepo } = buildUseCase({
      tokenRepo: { findByTokenHash: jest.fn().mockResolvedValue(token) },
    });

    const result = await useCase.execute(rawToken, 'nuevo-password');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(TokenExpiredError);
    expect(tokenRepo.delete).toHaveBeenCalledWith('t1');
    expect(userRepo.updatePasswordHash).not.toHaveBeenCalled();
  });
});
