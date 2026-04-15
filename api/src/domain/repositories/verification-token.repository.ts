import { VerificationToken, TokenType } from '../entities/verification-token.entity.js';

export interface CreateVerificationTokenData {
  userId: string;
  tokenHash: string;
  type: TokenType;
  expiresAt: Date;
}

export interface VerificationTokenRepository {
  create(data: CreateVerificationTokenData): Promise<VerificationToken>;
  findByTokenHash(tokenHash: string, type: TokenType): Promise<VerificationToken | null>;
  delete(id: string): Promise<boolean>;
  deleteAllByUserId(userId: string, type: TokenType): Promise<void>;
}
