import { UpdateMenuItemOptionGroupsUseCase } from './update-menu-item-option-groups.use-case.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { MenuItemOptionGroup } from '../../../domain/entities/menu-item-option-group.entity.js';
import { MenuItemType } from '../../../domain/enums/menu-item-type.enum.js';

function makeItem(
  restaurantId = 'r1',
  groups: MenuItemOptionGroup[] = [],
): MenuItem {
  return new MenuItem(
    'm1',
    restaurantId,
    'c1',
    '1 Kg',
    '',
    0,
    '',
    0,
    true,
    true,
    MenuItemType.SIMPLE,
    groups,
  );
}

describe('UpdateMenuItemOptionGroupsUseCase', () => {
  it('devuelve MenuItemNotFoundError si el producto no existe', async () => {
    const useCase = new UpdateMenuItemOptionGroupsUseCase(
      {
        findById: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      } as any,
      {
        findByItemId: jest.fn().mockResolvedValue([
          { optionGroup: 'Clasicos', variantId: null, isAvailable: true },
          { optionGroup: 'Clasicos', variantId: null, isAvailable: true },
        ]),
      } as any,
      { findByItemId: jest.fn().mockResolvedValue([]) } as any,
    );
    const result = await useCase.execute('m1', 'r1', []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('MENU_ITEM_NOT_FOUND');
  });

  it('devuelve CrossRestaurantAccessError si el producto es de otro local', async () => {
    const useCase = new UpdateMenuItemOptionGroupsUseCase(
      {
        findById: jest.fn().mockResolvedValue(makeItem('otro')),
        update: jest.fn(),
      } as any,
      {
        findByItemId: jest.fn().mockResolvedValue([
          { optionGroup: 'Clasicos', variantId: null, isAvailable: true },
          { optionGroup: 'Clasicos', variantId: null, isAvailable: true },
        ]),
      } as any,
      { findByItemId: jest.fn().mockResolvedValue([]) } as any,
    );
    const result = await useCase.execute('m1', 'r1', []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CROSS_RESTAURANT_ACCESS');
  });

  it('normaliza y persiste las reglas de grupo', async () => {
    const update = jest.fn().mockResolvedValue(makeItem());
    const useCase = new UpdateMenuItemOptionGroupsUseCase(
      {
        findById: jest.fn().mockResolvedValue(makeItem()),
        update,
      } as any,
      {
        findByItemId: jest.fn().mockResolvedValue([
          { optionGroup: 'Clasicos', variantId: null, isAvailable: true },
          { optionGroup: 'Clasicos', variantId: null, isAvailable: true },
        ]),
      } as any,
      { findByItemId: jest.fn().mockResolvedValue([]) } as any,
    );

    const result = await useCase.execute('m1', 'r1', [
      new MenuItemOptionGroup('  Clasicos  ', 2.9, 4.2, null, 0),
      new MenuItemOptionGroup('   ', 0, 0, null, 1),
    ]);

    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith('m1', {
      optionGroups: [
        {
          name: 'Clasicos',
          minSelections: 2,
          maxSelections: 4,
          variantId: null,
          displayOrder: 0,
          selectionScope: 'group',
          sourceCategoryId: null,
        },
      ],
    });
  });
  it('rechaza reglas imposibles sin persistirlas', async () => {
    const update = jest.fn();
    const useCase = new UpdateMenuItemOptionGroupsUseCase(
      { findById: jest.fn().mockResolvedValue(makeItem()), update } as any,
      { findByItemId: jest.fn().mockResolvedValue([]) } as any,
      { findByItemId: jest.fn().mockResolvedValue([]) } as any,
    );
    const result = await useCase.execute('m1', 'r1', [
      new MenuItemOptionGroup('Clasicos', 3, 2, null, 0),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('MENU_ITEM_OPTION_LIMIT');
    expect(update).not.toHaveBeenCalled();
  });
});
