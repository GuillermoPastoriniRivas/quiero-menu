export type StoreClaimStatus = 'pending' | 'approved' | 'rejected';

export class StoreClaim {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly message: string,
    public readonly status: StoreClaimStatus,
    public readonly createdAt: Date,
    public readonly reviewedAt: Date | null,
  ) {}
}
