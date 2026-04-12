import { MenuItemVariant } from '../entities/menu-item-variant.entity.js';

export interface MenuItemVariantRepository {
  create(data: Omit<MenuItemVariant, 'id'>): Promise<MenuItemVariant>;
  findByItemId(itemId: string): Promise<MenuItemVariant[]>;
  findByItemIds(itemIds: string[]): Promise<MenuItemVariant[]>;
  findById(id: string): Promise<MenuItemVariant | null>;
  update(id: string, data: Partial<Omit<MenuItemVariant, 'id' | 'itemId'>>): Promise<MenuItemVariant | null>;
  delete(id: string): Promise<boolean>;
  deleteByItemId(itemId: string): Promise<void>;
}
