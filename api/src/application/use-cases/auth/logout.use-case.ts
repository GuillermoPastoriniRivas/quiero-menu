import { createHash } from 'crypto';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import { Result, ok } from '../../common/result.js';

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  async execute(rawToken: string): Promise<Result<void, never>> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    // Idempotente: un token inexistente o ya revocado simplemente se ignora.
    if (stored) {
      await this.refreshTokenRepo.delete(stored.id);
    }

    return ok(undefined);
  }
}
