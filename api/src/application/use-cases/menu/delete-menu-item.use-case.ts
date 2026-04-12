import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class DeleteMenuItemUseCase {
  constructor(
    private readonly itemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
  ) {}

  async execute(id: string, restaurantId: string): Promise<Result<void, MenuItemNotFoundError | CrossRestaurantAccessError>> {
    const item = await this.itemRepo.findById(id);
    if (!item) return err(new MenuItemNotFoundError());
    if (item.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    await this.variantRepo.deleteByItemId(id);
    await this.optionRepo.deleteByItemId(id);
    await this.itemRepo.delete(id);

    return ok(undefined);
  }
}
