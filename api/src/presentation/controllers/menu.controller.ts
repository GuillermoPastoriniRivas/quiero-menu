import { Controller, Get, Post, Patch, Delete, Param, Body, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import {
  CreateCategoryRequestSchema, CreateCategoryRequestDto,
  UpdateCategoryRequestSchema, UpdateCategoryRequestDto,
  ReorderRequestSchema, ReorderRequestDto,
  CreateItemRequestSchema, CreateItemRequestDto,
  UpdateItemRequestSchema, UpdateItemRequestDto,
  CreateVariantRequestSchema, CreateVariantRequestDto,
  UpdateVariantRequestSchema, UpdateVariantRequestDto,
  CreateOptionRequestSchema, CreateOptionRequestDto,
  UpdateOptionRequestSchema, UpdateOptionRequestDto,
} from '../request-dtos/menu.dto.js';
import type { CreateMenuCategoryUseCase } from '../../application/use-cases/menu/create-menu-category.use-case.js';
import type { UpdateMenuCategoryUseCase } from '../../application/use-cases/menu/update-menu-category.use-case.js';
import type { DeleteMenuCategoryUseCase } from '../../application/use-cases/menu/delete-menu-category.use-case.js';
import type { ListMenuCategoriesUseCase } from '../../application/use-cases/menu/list-menu-categories.use-case.js';
import type { ReorderMenuCategoriesUseCase } from '../../application/use-cases/menu/reorder-menu-categories.use-case.js';
import type { CreateMenuItemUseCase } from '../../application/use-cases/menu/create-menu-item.use-case.js';
import type { UpdateMenuItemUseCase } from '../../application/use-cases/menu/update-menu-item.use-case.js';
import type { DeleteMenuItemUseCase } from '../../application/use-cases/menu/delete-menu-item.use-case.js';
import type { ToggleMenuItemAvailabilityUseCase } from '../../application/use-cases/menu/toggle-menu-item-availability.use-case.js';
import type { ReorderMenuItemsUseCase } from '../../application/use-cases/menu/reorder-menu-items.use-case.js';
import type { CreateMenuItemVariantUseCase } from '../../application/use-cases/menu/create-menu-item-variant.use-case.js';
import type { UpdateMenuItemVariantUseCase } from '../../application/use-cases/menu/update-menu-item-variant.use-case.js';
import type { DeleteMenuItemVariantUseCase } from '../../application/use-cases/menu/delete-menu-item-variant.use-case.js';
import type { CreateMenuItemOptionUseCase } from '../../application/use-cases/menu/create-menu-item-option.use-case.js';
import type { UpdateMenuItemOptionUseCase } from '../../application/use-cases/menu/update-menu-item-option.use-case.js';
import type { DeleteMenuItemOptionUseCase } from '../../application/use-cases/menu/delete-menu-item-option.use-case.js';
import { MenuItemType } from '../../domain/enums/menu-item-type.enum.js';

@Controller('menu')
export class MenuController {
  constructor(
    @Inject('CreateMenuCategoryUseCase') private readonly createCategory: CreateMenuCategoryUseCase,
    @Inject('UpdateMenuCategoryUseCase') private readonly updateCategory: UpdateMenuCategoryUseCase,
    @Inject('DeleteMenuCategoryUseCase') private readonly deleteCategory: DeleteMenuCategoryUseCase,
    @Inject('ListMenuCategoriesUseCase') private readonly listCategories: ListMenuCategoriesUseCase,
    @Inject('ReorderMenuCategoriesUseCase') private readonly reorderCategories: ReorderMenuCategoriesUseCase,
    @Inject('CreateMenuItemUseCase') private readonly createItem: CreateMenuItemUseCase,
    @Inject('UpdateMenuItemUseCase') private readonly updateItem: UpdateMenuItemUseCase,
    @Inject('DeleteMenuItemUseCase') private readonly deleteItem: DeleteMenuItemUseCase,
    @Inject('ToggleMenuItemAvailabilityUseCase') private readonly toggleAvailability: ToggleMenuItemAvailabilityUseCase,
    @Inject('ReorderMenuItemsUseCase') private readonly reorderItems: ReorderMenuItemsUseCase,
    @Inject('CreateMenuItemVariantUseCase') private readonly createVariant: CreateMenuItemVariantUseCase,
    @Inject('UpdateMenuItemVariantUseCase') private readonly updateVariant: UpdateMenuItemVariantUseCase,
    @Inject('DeleteMenuItemVariantUseCase') private readonly deleteVariant: DeleteMenuItemVariantUseCase,
    @Inject('CreateMenuItemOptionUseCase') private readonly createOption: CreateMenuItemOptionUseCase,
    @Inject('UpdateMenuItemOptionUseCase') private readonly updateOption: UpdateMenuItemOptionUseCase,
    @Inject('DeleteMenuItemOptionUseCase') private readonly deleteOption: DeleteMenuItemOptionUseCase,
  ) {}

  // Categories
  @Get('categories')
  async listCats(@CurrentUser() user: RequestUser) {
    return this.listCategories.execute(user.restaurantId);
  }

  @Post('categories')
  async createCat(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateCategoryRequestSchema)) body: CreateCategoryRequestDto) {
    const result = await this.createCategory.execute({ ...body, restaurantId: user.restaurantId, displayOrder: 0 });
    if (!result.ok) throw new BadRequestException(result.error);
    return result.value;
  }

  @Patch('categories/:id')
  async updateCat(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateCategoryRequestSchema)) body: UpdateCategoryRequestDto) {
    const result = await this.updateCategory.execute(id, user.restaurantId, body);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Delete('categories/:id')
  async deleteCat(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.deleteCategory.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return { success: true };
  }

  @Patch('categories/reorder')
  async reorderCats(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(ReorderRequestSchema)) body: ReorderRequestDto) {
    const result = await this.reorderCategories.execute(user.restaurantId, body.items);
    if (!result.ok) throw new ForbiddenException(result.error.message);
    return { success: true };
  }

  // Items
  @Post('items')
  async createIt(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreateItemRequestSchema)) body: CreateItemRequestDto) {
    const result = await this.createItem.execute({
      ...body,
      restaurantId: user.restaurantId,
      itemType: body.itemType as MenuItemType,
      displayOrder: 0,
    });
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('items/:id')
  async updateIt(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateItemRequestSchema)) body: UpdateItemRequestDto) {
    const result = await this.updateItem.execute(id, user.restaurantId, body as any);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Delete('items/:id')
  async deleteIt(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.deleteItem.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return { success: true };
  }

  @Patch('items/:id/toggle-availability')
  async toggleAvail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.toggleAvailability.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('items/reorder')
  async reorderIts(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(ReorderRequestSchema)) body: ReorderRequestDto) {
    const result = await this.reorderItems.execute(user.restaurantId, body.items);
    if (!result.ok) throw new ForbiddenException(result.error.message);
    return { success: true };
  }

  // Variants
  @Post('items/:itemId/variants')
  async createVar(@CurrentUser() user: RequestUser, @Param('itemId') itemId: string, @Body(new ZodValidationPipe(CreateVariantRequestSchema)) body: CreateVariantRequestDto) {
    const result = await this.createVariant.execute(user.restaurantId, { ...body, itemId });
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('variants/:id')
  async updateVar(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateVariantRequestSchema)) body: UpdateVariantRequestDto) {
    const result = await this.updateVariant.execute(id, user.restaurantId, body);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Delete('variants/:id')
  async deleteVar(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.deleteVariant.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return { success: true };
  }

  // Options
  @Post('items/:itemId/options')
  async createOpt(@CurrentUser() user: RequestUser, @Param('itemId') itemId: string, @Body(new ZodValidationPipe(CreateOptionRequestSchema)) body: CreateOptionRequestDto) {
    const result = await this.createOption.execute(user.restaurantId, { ...body, itemId });
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Patch('options/:id')
  async updateOpt(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(UpdateOptionRequestSchema)) body: UpdateOptionRequestDto) {
    const result = await this.updateOption.execute(id, user.restaurantId, body);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return result.value;
  }

  @Delete('options/:id')
  async deleteOpt(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.deleteOption.execute(id, user.restaurantId);
    if (!result.ok) throw result.error.code === 'CROSS_RESTAURANT_ACCESS' ? new ForbiddenException(result.error.message) : new NotFoundException(result.error.message);
    return { success: true };
  }
}
