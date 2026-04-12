import { MenuItemOption } from '../entities/menu-item-option.entity.js';

export interface MenuItemOptionRepository {
  create(data: Omit<MenuItemOption, 'id'>): Promise<MenuItemOption>;
  findByItemId(itemId: string): Promise<MenuItemOption[]>;
  findByItemIds(itemIds: string[]): Promise<MenuItemOption[]>;
  findByVariantId(variantId: string): Promise<MenuItemOption[]>;
  findById(id: string): Promise<MenuItemOption | null>;
  update(id: string, data: Partial<Omit<MenuItemOption, 'id' | 'itemId'>>): Promise<MenuItemOption | null>;
  delete(id: string): Promise<boolean>;
  deleteByItemId(itemId: string): Promise<void>;
}
