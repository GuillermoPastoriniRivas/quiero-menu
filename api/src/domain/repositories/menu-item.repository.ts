import { MenuItem } from '../entities/menu-item.entity.js';

export interface MenuItemRepository {
  create(data: Omit<MenuItem, 'id'>): Promise<MenuItem>;
  findByRestaurantId(restaurantId: string): Promise<MenuItem[]>;
  findByCategoryId(categoryId: string): Promise<MenuItem[]>;
  findById(id: string): Promise<MenuItem | null>;
  update(id: string, data: Partial<Omit<MenuItem, 'id' | 'restaurantId'>>): Promise<MenuItem | null>;
  delete(id: string): Promise<boolean>;
  reorder(items: { id: string; displayOrder: number }[]): Promise<void>;
  deleteByCategoryId(categoryId: string): Promise<void>;
}
