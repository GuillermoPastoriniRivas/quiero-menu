import { createHash } from 'crypto';
import type {
  TokenPayload,
  TokenProviderPort,
} from '../ports/token-provider.port.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function issueSession(
  tokenProvider: TokenProviderPort,
  refreshTokenRepo: RefreshTokenRepository,
  payload: TokenPayload,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = tokenProvider.signAccess(payload);
  const refreshToken = tokenProvider.signRefresh(payload);
  await refreshTokenRepo.create({
    userId: payload.sub,
    tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return { accessToken, refreshToken };
}
