export class DeliveryZone {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly price: number,
    public readonly estimatedMinutes: number,
    public readonly isActive: boolean,
  ) {}
}
