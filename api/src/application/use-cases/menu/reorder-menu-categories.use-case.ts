import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class ReorderMenuCategoriesUseCase {
  constructor(private readonly categoryRepo: MenuCategoryRepository) {}

  async execute(restaurantId: string, items: { id: string; displayOrder: number }[]): Promise<Result<void, CrossRestaurantAccessError>> {
    const categories = await this.categoryRepo.findByRestaurantId(restaurantId);
    const validIds = new Set(categories.map((c) => c.id));
    const allValid = items.every((item) => validIds.has(item.id));
    if (!allValid) return err(new CrossRestaurantAccessError());

    await this.categoryRepo.reorder(items);
    return ok(undefined);
  }
}
