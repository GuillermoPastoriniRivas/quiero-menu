import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuCategoryNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class CreateMenuItemUseCase {
  constructor(
    private readonly itemRepo: MenuItemRepository,
    private readonly categoryRepo: MenuCategoryRepository,
  ) {}

  async execute(data: Omit<MenuItem, 'id'>): Promise<Result<MenuItem, MenuCategoryNotFoundError | CrossRestaurantAccessError>> {
    const category = await this.categoryRepo.findById(data.categoryId);
    if (!category) return err(new MenuCategoryNotFoundError());
    if (category.restaurantId !== data.restaurantId) return err(new CrossRestaurantAccessError());

    const created = await this.itemRepo.create(data);
    return ok(created);
  }
}
