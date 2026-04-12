import { Restaurant } from '../entities/restaurant.entity.js';

export interface RestaurantRepository {
  create(data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Restaurant>;
  findById(id: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  update(id: string, data: Partial<Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Restaurant | null>;
}
