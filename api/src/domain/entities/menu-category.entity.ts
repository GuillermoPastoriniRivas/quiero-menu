export class MenuCategory {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly displayOrder: number,
    public readonly isVisible: boolean,
  ) {}
}
