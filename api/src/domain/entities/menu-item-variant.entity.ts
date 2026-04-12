export class MenuItemVariant {
  constructor(
    public readonly id: string,
    public readonly itemId: string,
    public readonly name: string,
    public readonly priceOverride: number | null,
    public readonly maxSelections: number,
    public readonly displayOrder: number = 0,
  ) {}
}
