import { MenuCategory } from '../entities/menu-category.entity.js';

export interface MenuCategoryRepository {
  create(data: Omit<MenuCategory, 'id'>): Promise<MenuCategory>;
  findByRestaurantId(restaurantId: string): Promise<MenuCategory[]>;
  findById(id: string): Promise<MenuCategory | null>;
  update(id: string, data: Partial<Omit<MenuCategory, 'id' | 'restaurantId'>>): Promise<MenuCategory | null>;
  delete(id: string): Promise<boolean>;
  reorder(items: { id: string; displayOrder: number }[]): Promise<void>;
}
