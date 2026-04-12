import { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import { MenuItemVariant } from '../../../domain/entities/menu-item-variant.entity.js';
import { Result, ok, err } from '../../common/result.js';
import { MenuItemVariantNotFoundError, CrossRestaurantAccessError } from '../../../domain/errors/domain-errors.js';

export class UpdateMenuItemVariantUseCase {
  constructor(
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly itemRepo: MenuItemRepository,
  ) {}

  async execute(id: string, restaurantId: string, data: Partial<Omit<MenuItemVariant, 'id' | 'itemId'>>): Promise<Result<MenuItemVariant, MenuItemVariantNotFoundError | CrossRestaurantAccessError>> {
    const existing = await this.variantRepo.findById(id);
    if (!existing) return err(new MenuItemVariantNotFoundError());

    const item = await this.itemRepo.findById(existing.itemId);
    if (!item || item.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());

    const updated = await this.variantRepo.update(id, data);
    if (!updated) return err(new MenuItemVariantNotFoundError());
    return ok(updated);
  }
}
