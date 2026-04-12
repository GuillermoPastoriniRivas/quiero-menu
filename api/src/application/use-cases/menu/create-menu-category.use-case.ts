import { MenuCategoryRepository } from '../../../domain/repositories/menu-category.repository.js';
import { MenuCategory } from '../../../domain/entities/menu-category.entity.js';
import { Result, ok } from '../../common/result.js';

export class CreateMenuCategoryUseCase {
  constructor(private readonly categoryRepo: MenuCategoryRepository) {}

  async execute(data: Omit<MenuCategory, 'id'>): Promise<Result<MenuCategory, never>> {
    const created = await this.categoryRepo.create(data);
    return ok(created);
  }
}
