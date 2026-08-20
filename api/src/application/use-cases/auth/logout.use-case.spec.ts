import { createHash } from 'crypto';
import { LogoutUseCase } from './logout.use-case.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';

describe('LogoutUseCase', () => {
  function buildUseCase(
    overrides: { refreshTokenRepo?: Partial<RefreshTokenRepository> } = {},
  ) {
    const refreshTokenRepo: RefreshTokenRepository = {
      create: jest.fn().mockResolvedValue({} as never),
      findByTokenHash: jest.fn().mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 1000),
      }),
      delete: jest.fn().mockResolvedValue(true),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined),
    };

    Object.assign(refreshTokenRepo, overrides.refreshTokenRepo);

    const useCase = new LogoutUseCase(refreshTokenRepo);
    return { useCase, refreshTokenRepo };
  }

  it('revoca el refresh token hasheando el raw token', async () => {
    const { useCase, refreshTokenRepo } = buildUseCase();

    const result = await useCase.execute('raw-refresh-token');

    expect(result.ok).toBe(true);
    expect(refreshTokenRepo.findByTokenHash).toHaveBeenCalledWith(
      createHash('sha256').update('raw-refresh-token').digest('hex'),
    );
    expect(refreshTokenRepo.delete).toHaveBeenCalledWith('rt1');
  });

  it('es idempotente cuando el token ya no existe', async () => {
    const { useCase, refreshTokenRepo } = buildUseCase({
      refreshTokenRepo: {
        findByTokenHash: jest.fn().mockResolvedValue(null),
      },
    });

    const result = await useCase.execute('unknown-token');

    expect(result.ok).toBe(true);
    expect(refreshTokenRepo.delete).not.toHaveBeenCalled();
  });
});
