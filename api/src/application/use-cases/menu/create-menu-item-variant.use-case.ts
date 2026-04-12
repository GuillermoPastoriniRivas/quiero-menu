import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariant } from '../../../domain/entities/menu-item-variant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class CreateMenuItemVariantUseCase {
  constructor(
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly itemRepo: MenuItemRepository,
  ) {}

  async execute(restaurantId: string, data: Omit<MenuItemVariant, 'id'>): Promise<Result<MenuItemVariant, MenuItemNotFoundError | CrossRestaurantAccessError>> {
    const item = await this.itemRepo.findById(data.itemId);
    if (!item) return err(new MenuItemNotFoundError());
    if (item.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const created = await this.variantRepo.create(data);
    return ok(created);
  }
}
