export type InvitationStatus = 'active' | 'accepted' | 'revoked' | 'expired';

export class Invitation {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly tokenHash: string,
    public readonly email: string | null,
    public readonly createdBy: string,
    public readonly expiresAt: Date,
    public readonly acceptedAt: Date | null,
    public readonly acceptedBy: string | null,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  statusAt(now: Date): InvitationStatus {
    if (this.acceptedAt) return 'accepted';
    if (this.revokedAt) return 'revoked';
    if (this.expiresAt <= now) return 'expired';
    return 'active';
  }
}
