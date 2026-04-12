export interface SelectedOption {
  optionId: string;
  name: string;
  priceDelta: number;
}

export class OrderItem {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly menuItemId: string,
    public readonly menuItemName: string,
    public readonly variantId: string | null,
    public readonly variantName: string | null,
    public readonly quantity: number,
    public readonly unitPrice: number,
    public readonly totalPrice: number,
    public readonly selectedOptions: SelectedOption[],
    public readonly notes: string,
  ) {}
}
