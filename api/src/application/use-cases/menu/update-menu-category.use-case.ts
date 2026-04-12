import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuCategory } from '../../../domain/entities/menu-category.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuCategoryNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class UpdateMenuCategoryUseCase {
  constructor(private readonly categoryRepo: MenuCategoryRepository) {}

  async execute(id: string, restaurantId: string, data: Partial<Omit<MenuCategory, 'id' | 'restaurantId'>>): Promise<Result<MenuCategory, MenuCategoryNotFoundError | CrossRestaurantAccessError>> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) return err(new MenuCategoryNotFoundError());
    if (existing.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const updated = await this.categoryRepo.update(id, data);
    if (!updated) return err(new MenuCategoryNotFoundError());
    return ok(updated);
  }
}
