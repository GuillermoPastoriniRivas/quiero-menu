import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemOption } from '../../../domain/entities/menu-item-option.entity.js';
import type { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { validateLocalMenuOption } from '../../../domain/services/local-menu-option.js';
import { Result, ok, err } from '../../common/result.js';
import {
  MenuItemOptionNotFoundError,
  CrossRestaurantAccessError,
  MenuItemOptionLimitError,
} from '../../../domain/errors/domain-errors.js';

export class UpdateMenuItemOptionUseCase {
  constructor(
    private readonly optionRepo: MenuItemOptionRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
  ) {}

  async execute(
    id: string,
    restaurantId: string,
    data: Partial<Omit<MenuItemOption, 'id' | 'itemId'>>,
  ): Promise<
    Result<
      MenuItemOption,
      MenuItemOptionNotFoundError | CrossRestaurantAccessError | MenuItemOptionLimitError
    >
  > {
    const existing = await this.optionRepo.findById(id);
    if (!existing) return err(new MenuItemOptionNotFoundError());

    const item = await this.itemRepo.findById(existing.itemId);
    if (!item || item.restaurantId !== restaurantId)
      return err(new CrossRestaurantAccessError());

    const variants = await this.variantRepo.findByItemId(item.id);
    const error = validateLocalMenuOption(item, { ...existing, ...data }, variants);
    if (error) return err(new MenuItemOptionLimitError(error));

    const updated = await this.optionRepo.update(id, data);
    if (!updated) return err(new MenuItemOptionNotFoundError());
    return ok(updated);
  }
}
