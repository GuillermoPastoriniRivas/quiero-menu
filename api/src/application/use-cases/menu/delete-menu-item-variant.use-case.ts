import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemVariantNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class DeleteMenuItemVariantUseCase {
  constructor(
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly itemRepo: MenuItemRepository,
  ) {}

  async execute(id: string, restaurantId: string): Promise<Result<void, MenuItemVariantNotFoundError | CrossRestaurantAccessError>> {
    const existing = await this.variantRepo.findById(id);
    if (!existing) return err(new MenuItemVariantNotFoundError());

    const item = await this.itemRepo.findById(existing.itemId);
    if (!item || item.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    await this.variantRepo.delete(id);
    return ok(undefined);
  }
}
