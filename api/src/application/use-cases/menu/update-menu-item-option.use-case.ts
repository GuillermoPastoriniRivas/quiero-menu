import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemOption } from '../../../domain/entities/menu-item-option.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemOptionNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class UpdateMenuItemOptionUseCase {
  constructor(
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly itemRepo: MenuItemRepository,
  ) {}

  async execute(id: string, restaurantId: string, data: Partial<Omit<MenuItemOption, 'id' | 'itemId'>>): Promise<Result<MenuItemOption, MenuItemOptionNotFoundError | CrossRestaurantAccessError>> {
    const existing = await this.optionRepo.findById(id);
    if (!existing) return err(new MenuItemOptionNotFoundError());

    const item = await this.itemRepo.findById(existing.itemId);
    if (!item || item.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const updated = await this.optionRepo.update(id, data);
    if (!updated) return err(new MenuItemOptionNotFoundError());
    return ok(updated);
  }
}
