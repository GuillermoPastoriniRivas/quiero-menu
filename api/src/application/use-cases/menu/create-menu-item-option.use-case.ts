import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemOption } from '../../../domain/entities/menu-item-option.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class CreateMenuItemOptionUseCase {
  constructor(
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly itemRepo: MenuItemRepository,
  ) {}

  async execute(restaurantId: string, data: Omit<MenuItemOption, 'id'>): Promise<Result<MenuItemOption, MenuItemNotFoundError | CrossRestaurantAccessError>> {
    const item = await this.itemRepo.findById(data.itemId);
    if (!item) return err(new MenuItemNotFoundError());
    if (item.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const created = await this.optionRepo.create(data);
    return ok(created);
  }
}
