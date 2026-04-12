export class KitchenAccessToken {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly token: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date | null,
    public readonly revokedAt: Date | null,
  ) {}
}
