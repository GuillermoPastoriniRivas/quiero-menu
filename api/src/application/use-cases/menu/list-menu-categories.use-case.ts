import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuCategory } from '../../../domain/entities/menu-category.entity.js';

export class ListMenuCategoriesUseCase {
  constructor(private readonly categoryRepo: MenuCategoryRepository) {}

  async execute(restaurantId: string): Promise<MenuCategory[]> {
    return this.categoryRepo.findByRestaurantId(restaurantId);
  }
}
