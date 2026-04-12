import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class ToggleMenuItemAvailabilityUseCase {
  constructor(private readonly itemRepo: MenuItemRepository) {}

  async execute(id: string, restaurantId: string): Promise<Result<MenuItem, MenuItemNotFoundError | CrossRestaurantAccessError>> {
    const item = await this.itemRepo.findById(id);
    if (!item) return err(new MenuItemNotFoundError());
    if (item.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const updated = await this.itemRepo.update(id, { isAvailable: !item.isAvailable });
    if (!updated) return err(new MenuItemNotFoundError());
    return ok(updated);
  }
}
