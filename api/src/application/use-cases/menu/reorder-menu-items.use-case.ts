import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class ReorderMenuItemsUseCase {
  constructor(private readonly itemRepo: MenuItemRepository) {}

  async execute(restaurantId: string, items: { id: string; displayOrder: number }[]): Promise<Result<void, CrossRestaurantAccessError>> {
    const allItems = await this.itemRepo.findByRestaurantId(restaurantId);
    const validIds = new Set(allItems.map((i) => i.id));
    const allValid = items.every((item) => validIds.has(item.id));
    if (!allValid) return err(new CrossRestaurantAccessError());

    await this.itemRepo.reorder(items);
    return ok(undefined);
  }
}
