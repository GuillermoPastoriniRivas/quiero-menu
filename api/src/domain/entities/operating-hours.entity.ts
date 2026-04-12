export class OperatingHours {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly dayOfWeek: number,
    public readonly opensAt: string,
    public readonly closesAt: string,
    public readonly isClosed: boolean,
  ) {}
}
