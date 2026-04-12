import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class UpdateMenuItemUseCase {
  constructor(private readonly itemRepo: MenuItemRepository) {}

  async execute(id: string, restaurantId: string, data: Partial<Omit<MenuItem, 'id' | 'restaurantId'>>): Promise<Result<MenuItem, MenuItemNotFoundError | CrossRestaurantAccessError>> {
    const existing = await this.itemRepo.findById(id);
    if (!existing) return err(new MenuItemNotFoundError());
    if (existing.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const updated = await this.itemRepo.update(id, data);
    if (!updated) return err(new MenuItemNotFoundError());
    return ok(updated);
  }
}
