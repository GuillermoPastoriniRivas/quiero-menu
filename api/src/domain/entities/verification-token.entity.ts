export type TokenType = 'email_verification' | 'password_reset';

export class VerificationToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: string,
    public readonly type: TokenType,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
  ) {}

  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}
