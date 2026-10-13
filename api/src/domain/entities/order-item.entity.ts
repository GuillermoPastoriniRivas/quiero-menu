export interface SelectedOption {
  optionId: string;
  name: string;
  priceDelta: number;
  quantity?: number;
  groupId?: string;
  groupName?: string;
  sourceItemId?: string;
}

export interface OrderItemComponent {
  slotId: string;
  slotName: string;
  quantity: number;
  menuItemId: string;
  menuItemName: string;
  variantId: string | null;
  variantName: string | null;
  priceDelta: number;
  selectedOptions: SelectedOption[];
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
    public readonly components: OrderItemComponent[] = [],
  ) {}
}
