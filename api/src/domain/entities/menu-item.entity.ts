import { MenuItemType } from '../enums/menu-item-type.enum.js';

export class MenuItem {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly categoryId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly basePrice: number,
    public readonly imageUrl: string,
    public readonly displayOrder: number,
    public readonly isAvailable: boolean,
    public readonly isVisible: boolean,
    public readonly itemType: MenuItemType,
  ) {}
}
