import type { MenuVisionOutput } from '../../ports/menu-vision.port.js';
import type { RestaurantRepository } from '../../../domain/repositories/restaurant.repository.js';
import type { OperatingHoursRepository } from '../../../domain/repositories/operating-hours.repository.js';
import type { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import type { MenuItemRepository } from '../../../domain/repositories/menu-item.repository.js';
import type { MenuItemVariantRepository } from '../../../domain/repositories/menu-item-variant.repository.js';
import type { MenuItemOptionRepository } from '../../../domain/repositories/menu-item-option.repository.js';
import { MenuItemType } from '../../../domain/enums/menu-item-type.enum.js';
import { Result, ok } from '../../common/result.js';

export interface BulkImportResult {
  categories: number;
  items: number;
  variants: number;
  options: number;
}

export class BulkImportMenuUseCase {
  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly hoursRepo: OperatingHoursRepository,
    private readonly categoryRepo: MenuCategoryRepository,
    private readonly itemRepo: MenuItemRepository,
    private readonly variantRepo: MenuItemVariantRepository,
    private readonly optionRepo: MenuItemOptionRepository,
  ) {}

  async execute(
    restaurantId: string,
    data: MenuVisionOutput,
  ): Promise<Result<BulkImportResult, never>> {
    const counts: BulkImportResult = { categories: 0, items: 0, variants: 0, options: 0 };

    // Update restaurant info
    const restUpdate: Record<string, string> = {};
    if (data.restaurant.name) restUpdate.name = data.restaurant.name;
    if (data.restaurant.phone) restUpdate.phone = data.restaurant.phone;
    if (data.restaurant.address) restUpdate.address = data.restaurant.address;
    if (data.restaurant.city) restUpdate.city = data.restaurant.city;
    if (data.restaurant.currency) restUpdate.currency = data.restaurant.currency;
    if (Object.keys(restUpdate).length > 0) {
      await this.restaurantRepo.update(restaurantId, restUpdate);
    }

    // Upsert operating hours
    if (data.operatingHours && data.operatingHours.length > 0) {
      await this.hoursRepo.upsertBulk(
        restaurantId,
        data.operatingHours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        })),
      );
    }

    // Get existing categories to determine display order offset
    const existingCategories = await this.categoryRepo.findByRestaurantId(restaurantId);
    let categoryOrder = existingCategories.length;

    for (const cat of data.categories) {
      const category = await this.categoryRepo.create({
        restaurantId,
        name: cat.name,
        description: cat.description || '',
        displayOrder: categoryOrder++,
        isVisible: true,
      });
      counts.categories++;

      let itemOrder = 0;
      for (const item of cat.items) {
        const itemType = item.itemType === 'variant'
          ? MenuItemType.VARIANT
          : item.itemType === 'combo'
            ? MenuItemType.COMBO
            : MenuItemType.SIMPLE;

        const menuItem = await this.itemRepo.create({
          restaurantId,
          categoryId: category.id,
          name: item.name,
          description: item.description || '',
          basePrice: item.basePrice,
          imageUrl: '',
          displayOrder: itemOrder++,
          isAvailable: true,
          isVisible: true,
          itemType,
        });
        counts.items++;

        if (item.variants && item.variants.length > 0) {
          let varOrder = 0;
          for (const v of item.variants) {
            await this.variantRepo.create({
              itemId: menuItem.id,
              name: v.name,
              priceOverride: v.priceOverride,
              maxSelections: 1,
              displayOrder: varOrder++,
            });
            counts.variants++;
          }
        }

        if (item.options && item.options.length > 0) {
          for (const opt of item.options) {
            await this.optionRepo.create({
              itemId: menuItem.id,
              variantId: null,
              name: opt.name,
              priceDelta: opt.priceDelta,
              optionGroup: opt.optionGroup,
              isAvailable: true,
            });
            counts.options++;
          }
        }
      }
    }

    return ok(counts);
  }
}
