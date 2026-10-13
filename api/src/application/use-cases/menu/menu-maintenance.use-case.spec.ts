import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { MenuCategory } from '../../../domain/entities/menu-category.entity.js';
import { MenuItemVariant } from '../../../domain/entities/menu-item-variant.entity.js';
import { MenuItemOption } from '../../../domain/entities/menu-item-option.entity.js';
import { MenuItemOptionGroup } from '../../../domain/entities/menu-item-option-group.entity.js';
import { MenuItemType } from '../../../domain/enums/menu-item-type.enum.js';
import { GetMenuUseCase } from './get-menu.use-case.js';
import { UpdateMenuItemOptionGroupsUseCase } from './update-menu-item-option-groups.use-case.js';
import { UpdateMenuItemComponentsUseCase } from './update-menu-item-components.use-case.js';
import { UpdateMenuItemUseCase } from './update-menu-item.use-case.js';
import { CreateMenuItemOptionUseCase } from './create-menu-item-option.use-case.js';
import { UpdateMenuItemOptionUseCase } from './update-menu-item-option.use-case.js';
import { CreateMenuItemVariantUseCase } from './create-menu-item-variant.use-case.js';
import { UpdateMenuItemVariantUseCase } from './update-menu-item-variant.use-case.js';
import { resolveOptionGroups } from '../../../domain/services/menu-option-groups.js';

const item = (id: string, categoryId = 'c1') => new MenuItem(id, 'r1', categoryId, id, '', 100, '', 0, true, true, MenuItemType.SIMPLE);
function fixture() {
  const categories = [new MenuCategory('c1', 'r1', 'Carta', '', 0, true), new MenuCategory('s1', 'r1', 'Sabores', '', 1, false, true)];
  const items = [item('p1'), item('flavor', 's1')];
  const variants = [new MenuItemVariant('v1', 'p1', 'Chico', 100, 1)];
  const options = [new MenuItemOption('o1', 'p1', null, 'Extra', 10, 'Extras', true)];
  const itemRepo = {
    findById: jest.fn(async (id: string) => items.find((i) => i.id === id) ?? null),
    findByRestaurantId: jest.fn(async () => items),
    update: jest.fn(async (id: string, data: Partial<MenuItem>) => {
      const index = items.findIndex((i) => i.id === id);
      if (index < 0) return null;
      items[index] = { ...items[index], ...data };
      return items[index];
    }),
  };
  const optionRepo = {
    findByItemId: jest.fn(async (id: string) => options.filter((o) => o.itemId === id)),
    findByItemIds: jest.fn(async (ids: string[]) => options.filter((o) => ids.includes(o.itemId))),
    findById: jest.fn(async (id: string) => options.find((o) => o.id === id) ?? null),
    update: jest.fn(async (id: string, data: Partial<MenuItemOption>) => {
      const index = options.findIndex((o) => o.id === id);
      options[index] = { ...options[index], ...data };
      return options[index];
    }),
    create: jest.fn(async (data: Omit<MenuItemOption, 'id'>) => ({ id: 'new', ...data })),
  };
  const variantRepo = {
    findById: jest.fn(async (id: string) => variants.find((v) => v.id === id) ?? null),
    findByItemId: jest.fn(async (id: string) => variants.filter((v) => v.itemId === id)),
    findByItemIds: jest.fn(async (ids: string[]) => variants.filter((v) => ids.includes(v.itemId))),
    create: jest.fn(async (data: object) => ({ id: 'new-variant', isAvailable: true, ...data })),
    update: jest.fn(async (id: string, data: Partial<MenuItemVariant>) => ({ ...variants.find((v) => v.id === id), ...data })),
  };
  const categoryRepo = {
    findByRestaurantId: jest.fn(async () => categories),
    findById: jest.fn(async (id: string) => categories.find((c) => c.id === id) ?? null),
  };
  const restaurantRepo = {
    findById: jest.fn(async (id: string) => ({ id, name: 'Local', slug: 'local', currency: 'ARS' })),
  };
  return { categories, items, variants, options, itemRepo, optionRepo, variantRepo, categoryRepo, restaurantRepo,
    groups: new UpdateMenuItemOptionGroupsUseCase(itemRepo as any, optionRepo as any, variantRepo as any, categoryRepo as any),
    components: new UpdateMenuItemComponentsUseCase(itemRepo as any, categoryRepo as any, variantRepo as any) };
}

describe('Administrative menu and stable group maintenance', () => {
  it('includes hidden/sold-out rows, keeps local and stored config separate from effective config', async () => {
    const f = fixture();
    f.items[0] = { ...f.items[0], isVisible: false, isAvailable: false };
    const get = new GetMenuUseCase(f.categoryRepo as any, f.itemRepo as any, f.variantRepo as any, f.optionRepo as any, f.restaurantRepo as any);
    const before = await get.execute('r1');
    const after = await get.execute('r1');
    expect(before.categories).toHaveLength(2);
    const product = before.categories[0].items[0];
    expect(product).toMatchObject({ isVisible: false, isAvailable: false, optionGroups: [], options: [{ id: 'o1' }], components: [] });
    expect(product.effectiveOptionGroups[0]).toMatchObject({ groupId: 'legacy:Extras', selectionScope: 'item', maxSelections: 1 });
    expect(after.categories[0].items[0].effectiveOptionGroups).toEqual(product.effectiveOptionGroups);
    expect(before.categories[1].items[0].isOrderable).toBe(false);
    expect(f.itemRepo.update).not.toHaveBeenCalled();
  });

  it('persists deterministic IDs once, binds old options and preserves their identity through rename', async () => {
    const f = fixture();
    const first = await f.groups.execute('p1', 'r1', [new MenuItemOptionGroup('Extras', 0, 2)]);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const saved = first.value.optionGroups![0];
    expect(saved.groupId).toBe('legacy:Extras');
    expect(f.options[0].groupId).toBe(saved.groupId);
    const renamed = await f.groups.execute('p1', 'r1', [{ ...saved, name: 'Adicionales' }]);
    expect(renamed.ok).toBe(true);
    expect(f.options[0]).toMatchObject({ groupId: saved.groupId, optionGroup: 'Adicionales' });
    const resolved = resolveOptionGroups(f.items[0], f.variants, f.options, 'v1');
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ groupId: saved.groupId, name: 'Adicionales' });
  });

  it('inherits the general group identity and new mode fields for variant overrides', async () => {
    const f = fixture();
    const general = new MenuItemOptionGroup('Extras', 0, 0, null, 0, 'group', null, 'extras', 'quantities', 6);
    const specific = new MenuItemOptionGroup('Extras', 1, 1, 'v1');
    const result = await f.groups.execute('p1', 'r1', [general, specific]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.optionGroups![1]).toMatchObject({ groupId: 'extras', selectionMode: 'quantities', requiredTotal: 6 });
  });

  it('inherits a shared source when omitted on the override and keeps explicit null as detachment', async () => {
    const f = fixture();
    const general = new MenuItemOptionGroup('Sabores', 0, 1, null, 0, 'group', 's1', 'flavors', 'single');
    const specific = { name: 'Sabores del chico', minSelections: 1, maxSelections: 1, variantId: 'v1', displayOrder: 0, groupId: 'flavors' };
    const saved = await f.groups.execute('p1', 'r1', [general, specific]);
    expect(saved.ok).toBe(true);
    if (saved.ok) expect(saved.value.optionGroups![1]).toMatchObject({ sourceCategoryId: 's1', groupId: 'flavors', selectionMode: 'single' });
    const detached = await f.groups.execute('p1', 'r1', [general, { ...specific, sourceCategoryId: null, minSelections: 0 }]);
    expect(detached.ok).toBe(true);
    if (detached.ok) expect(detached.value.optionGroups![1].sourceCategoryId).toBeNull();
  });

  it.each([
    new MenuItemOptionGroup('Extras', 0, 1, null, 0, 'group', null, 'extras', 'quantities'),
    new MenuItemOptionGroup('Extras', 0, 2, null, 0, 'group', null, 'extras', 'single'),
    new MenuItemOptionGroup('Extras', 0, 1, null, 0, 'group', null, 'extras', 'multiple', 6),
    new MenuItemOptionGroup('Extras', 2, 2),
    new MenuItemOptionGroup('Extras', 0, 0, 'foreign-variant'),
    new MenuItemOptionGroup('Extras', 0, 0, null, 0, 'group', 'foreign-source'),
    new MenuItemOptionGroup('Extras', 0, 0, null, 0, 'group', null, 'extras', 'multiple', null, [{ sourceItemId: 'flavor', priceDelta: 1 }]),
  ])('rejects impossible or foreign group config without writing: %j', async (rule) => {
    const f = fixture();
    expect((await f.groups.execute('p1', 'r1', [rule])).ok).toBe(false);
    expect(f.itemRepo.update).not.toHaveBeenCalled();
  });

  it('rejects duplicate logical IDs even when their display names differ', async () => {
    const f = fixture();
    expect((await f.groups.execute('p1', 'r1', [
      new MenuItemOptionGroup('Extras', 0, 0, null, 0, 'group', null, 'same'),
      new MenuItemOptionGroup('Other', 0, 0, null, 1, 'group', null, 'same'),
    ])).ok).toBe(false);
  });

  it('keeps shared catalog surcharge/context price and rejects override refs outside its source', async () => {
    const f = fixture();
    const rule = new MenuItemOptionGroup('Sabores', 1, 1, null, 0, 'group', 's1', 'flavors', 'single', null, [{ sourceItemId: 'flavor', priceDelta: 5 }]);
    expect((await f.groups.execute('p1', 'r1', [rule])).ok).toBe(true);
    const get = new GetMenuUseCase(f.categoryRepo as any, f.itemRepo as any, f.variantRepo as any, f.optionRepo as any, f.restaurantRepo as any);
    const data = await get.execute('r1');
    expect(data.categories[0].items[0].resolvedOptions.find((o) => o.sourceItemId === 'flavor')?.priceDelta).toBe(5);
    expect(f.items[1].basePrice).toBe(100);
    expect((await f.groups.execute('p1', 'r1', [{ ...rule, optionPriceOverrides: [{ sourceItemId: 'outside', priceDelta: 5 }] }])).ok).toBe(false);
  });
});

describe('Reference validation in CRUD', () => {
  it('rejects changing an item to a category owned by another restaurant', async () => {
    const f = fixture();
    f.categories.push(new MenuCategory('foreign', 'r2', 'Foreign', '', 0, true));
    const update = new UpdateMenuItemUseCase(f.itemRepo as any, f.categoryRepo as any);
    expect((await update.execute('p1', 'r1', { categoryId: 'foreign' })).ok).toBe(false);
    expect(f.itemRepo.update).not.toHaveBeenCalled();
  });

  it('rejects foreign option variants and silently shadowed local options on shared groups', async () => {
    const f = fixture();
    const create = new CreateMenuItemOptionUseCase(f.optionRepo as any, f.itemRepo as any, f.variantRepo as any);
    const update = new UpdateMenuItemOptionUseCase(f.optionRepo as any, f.itemRepo as any, f.variantRepo as any);
    expect((await create.execute('r1', { ...f.options[0], variantId: 'foreign' })).ok).toBe(false);
    expect((await update.execute('o1', 'r1', { variantId: 'foreign' })).ok).toBe(false);
    f.items[0] = { ...f.items[0], optionGroups: [new MenuItemOptionGroup('Extras', 0, 0, null, 0, 'group', 's1')] };
    expect((await create.execute('r1', f.options[0])).ok).toBe(false);
    expect(f.optionRepo.create).not.toHaveBeenCalled();
    expect(f.optionRepo.update).not.toHaveBeenCalled();
  });

  it('creates and updates variant availability independently of product availability', async () => {
    const f = fixture();
    const create = new CreateMenuItemVariantUseCase(f.variantRepo as any, f.itemRepo as any);
    const update = new UpdateMenuItemVariantUseCase(f.variantRepo as any, f.itemRepo as any);
    const created = await create.execute('r1', { itemId: 'p1', name: 'Grande', priceOverride: 200, maxSelections: 1, displayOrder: 1, isAvailable: false });
    expect(created.ok).toBe(true);
    if (created.ok) expect(created.value.isAvailable).toBe(false);
    const off = await update.execute('v1', 'r1', { isAvailable: false });
    expect(off.ok).toBe(true);
    if (off.ok) expect(off.value.isAvailable).toBe(false);
    expect(f.items[0].isAvailable).toBe(true);
    expect((await update.execute('v1', 'r2', { isAvailable: true })).ok).toBe(false);
  });
});

describe('Bounded promo component configuration', () => {
  const slot = () => ({ slotId: 'pastry', name: 'Medialunas', displayOrder: 0, parentVariantId: null as string | null,
    quantity: 6, choices: [{ menuItemId: 'p1', variantId: 'v1' as string | null, priceDelta: 0 }] });

  it('saves reusable references and fixed quantities without cloning the included product', async () => {
    const f = fixture();
    f.items.push(item('promo'));
    expect((await f.components.execute('promo', 'r1', [slot()])).ok).toBe(true);
    expect(f.itemRepo.update).toHaveBeenCalledWith('promo', { components: [slot()] });
    expect(f.items).toHaveLength(3);
    expect((await f.components.execute('promo', 'r2', [slot()])).ok).toBe(false);
  });

  it.each(['self', 'source', 'foreign', 'missing-variant', 'wrong-variant', 'parent-variant', 'nested', 'duplicate', 'empty', 'fraction'])('rejects %s without a write', async (scenario) => {
    const f = fixture();
    f.items.push(item('promo'));
    const value = slot();
    if (scenario === 'self') value.choices[0].menuItemId = 'promo';
    if (scenario === 'source') value.choices[0].menuItemId = 'flavor';
    if (scenario === 'foreign') f.items[0] = { ...f.items[0], restaurantId: 'r2' };
    if (scenario === 'missing-variant') value.choices[0].variantId = null;
    if (scenario === 'wrong-variant') value.choices[0].variantId = 'foreign';
    if (scenario === 'parent-variant') value.parentVariantId = 'v1';
    if (scenario === 'nested') f.items[0] = { ...f.items[0], components: [slot()] };
    if (scenario === 'empty') value.choices = [];
    if (scenario === 'fraction') value.quantity = 1.5;
    const slots = scenario === 'duplicate' ? [value, value] : [value];
    expect((await f.components.execute('promo', 'r1', slots)).ok).toBe(false);
    expect(f.itemRepo.update).not.toHaveBeenCalled();
  });

  it('prevents a referenced product from becoming a nested promo later', async () => {
    const f = fixture();
    f.items.push({ ...item('promo'), components: [slot()] });
    expect((await f.components.execute('p1', 'r1', [{ ...slot(), choices: [{ menuItemId: 'flavor', variantId: null, priceDelta: 0 }] }])).ok).toBe(false);
    expect(f.itemRepo.update).not.toHaveBeenCalled();
  });
});
