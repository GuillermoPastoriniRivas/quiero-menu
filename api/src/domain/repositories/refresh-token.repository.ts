import { RefreshToken } from '../entities/refresh-token.entity.js';

export interface RefreshTokenRepository {
  create(data: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  delete(id: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<void>;
}
