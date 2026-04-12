import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuCategoryNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class DeleteMenuCategoryUseCase {
  constructor(
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
  ) {}

  async execute(id: string, restaurantId: string): Promise<Result<void, MenuCategoryNotFoundError | CrossRestaurantAccessError>> {
    const category = await this.categoryRepo.findById(id);
    if (!category) return err(new MenuCategoryNotFoundError());
    if (category.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const items = await this.itemRepo.findByCategoryId(id);
    for (const item of items) {
      await this.variantRepo.deleteByItemId(item.id);
      await this.optionRepo.deleteByItemId(item.id);
    }
    await this.itemRepo.deleteByCategoryId(id);
    await this.categoryRepo.delete(id);

    return ok(undefined);
  }
}
