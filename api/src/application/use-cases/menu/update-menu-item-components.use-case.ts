import type { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import type { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import type { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import type { MenuItemComponent } from '../../../domain/entities/menu-item-component.entity.js';
import { validateMenuComponents } from '../../../domain/services/menu-components.js';
import { CrossRestaurantAccessError, MenuItemNotFoundError, MenuItemOptionLimitError } from '../../../domain/errors/domain-errors.js';
import { err, ok } from '../../common/result.js';

export class UpdateMenuItemComponentsUseCase {
  constructor(
    private readonly itemRepo: MenuItemRepository,
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly variantRepo: MenuItemVariantRepository,
  ) {}

  async execute(id: string, restaurantId: string, components: MenuItemComponent[]) {
    const parent = await this.itemRepo.findById(id);
    if (!parent) return err(new MenuItemNotFoundError());
    if (parent.restaurantId !== restaurantId) return err(new CrossRestaurantAccessError());
    const [categories, items] = await Promise.all([
      this.categoryRepo.findByRestaurantId(restaurantId), this.itemRepo.findByRestaurantId(restaurantId),
    ]);
    const variants = await this.variantRepo.findByItemIds(items.map((item) => item.id));
    const normalized = components.map((slot) => ({
      ...slot, slotId: slot.slotId.trim(), name: slot.name.trim(),
      parentVariantId: slot.parentVariantId ?? null,
      choices: slot.choices.map((choice) => ({ ...choice, variantId: choice.variantId ?? null })),
    }));
    const error = validateMenuComponents(parent, normalized, categories, items, variants);
    if (error) return err(new MenuItemOptionLimitError(error));
    const updated = await this.itemRepo.update(id, { components: normalized });
    return updated ? ok(updated) : err(new MenuItemNotFoundError());
  }
}
