export class MenuItemOption {
  constructor(
    public readonly id: string,
    public readonly itemId: string,
    public readonly variantId: string | null,
    public readonly name: string,
    public readonly priceDelta: number,
    public readonly optionGroup: string,
    public readonly isAvailable: boolean,
  ) {}
}
