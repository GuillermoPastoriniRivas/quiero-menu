/** A fixed or configurable slot. Quantity repeats this slot's configuration. */
export interface MenuItemComponent {
  slotId: string;
  name: string;
  displayOrder: number;
  parentVariantId: string | null;
  quantity: number;
  choices: {
    menuItemId: string;
    variantId: string | null;
    priceDelta: number;
  }[];
}
