import { UserRestaurant } from '../entities/user-restaurant.entity.js';

export interface UserRestaurantRepository {
  create(data: Omit<UserRestaurant, 'id'>): Promise<UserRestaurant>;
  findByUserId(userId: string): Promise<UserRestaurant[]>;
  findByRestaurantId(restaurantId: string): Promise<UserRestaurant[]>;
  findByUserIdAndRestaurantId(userId: string, restaurantId: string): Promise<UserRestaurant | null>;
  delete(id: string): Promise<boolean>;
}
