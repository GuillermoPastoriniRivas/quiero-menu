import { MenuItem } from '../entities/menu-item.entity.js';
import { MenuCategory } from '../entities/menu-category.entity.js';
import { MenuItemOptionGroup } from '../entities/menu-item-option-group.entity.js';
import { MenuItemType } from '../enums/menu-item-type.enum.js';
import { resolveSharedMenuOptions } from './shared-menu-options.js';
import {
  resolveOptionGroups,
  validateOptionSelection,
} from './menu-option-groups.js';
import { CreateStorefrontOrderUseCase } from '../../application/use-cases/order/create-storefront-order.use-case.js';
import { GetRestaurantBySlugUseCase } from '../../application/use-cases/restaurant/get-restaurant-by-slug.use-case.js';

const source = new MenuCategory('source', 'r1', 'Sabores', '', 3, true, true);
const regular = new MenuCategory('potes', 'r1', 'Potes', '', 0, true);
function product(id: string, categoryId: string, max = 0, restaurantId = 'r1') {
  return new MenuItem(
    id,
    restaurantId,
    categoryId,
    id,
    '',
    100,
    '',
    0,
    true,
    true,
    MenuItemType.SIMPLE,
    max
      ? [
          new MenuItemOptionGroup(
            'Sabores',
            1,
            max,
            null,
            0,
            'group',
            source.id,
          ),
        ]
      : [],
  );
}
const restaurant = {
  id: 'r1',
  status: 'active',
  phone: '+549000000',
  timezone: 'America/Argentina/Buenos_Aires',
  openOverride: 'open',
};
const flavors = Array.from({ length: 16 }, (_, i) =>
  product(`flavor-${i}`, 'source'),
);
function fixture(
  potes = [
    product('quarter', 'potes', 2),
    product('half', 'potes', 3),
    product('kilo', 'potes', 4),
  ],
  currentFlavors = flavors,
  categories = [regular, source],
) {
  const items = [...potes, ...currentFlavors];
  const itemRepo = {
    findById: jest.fn((id: string) => items.find((i) => i.id === id)),
    findByRestaurantId: jest.fn(() => items),
  };
  const categoryRepo = { findByRestaurantId: jest.fn(() => categories) };
  const variantRepo = {
    findByItemId: jest.fn(() => []),
    findByItemIds: jest.fn(() => []),
  };
  const optionRepo = {
    findByItemId: jest.fn(() => []),
    findByItemIds: jest.fn(() => []),
  };
  const restaurantRepo = { findBySlug: jest.fn(() => restaurant) };
  const hoursRepo = { findByRestaurantId: jest.fn(() => []) };
  const orderRepo = {
    generateNextCode: jest.fn(() => 'TEST'),
    findByTrackingToken: jest.fn(() => null),
    create: jest.fn((data: object) => ({ id: 'order', ...data })),
  };
  const checkout = new CreateStorefrontOrderUseCase(
    orderRepo as any,
    {
      createBulk: jest.fn((rows: object[]) =>
        rows.map((r, i) => ({ id: String(i), ...r })),
      ),
    } as any,
    restaurantRepo as any,
    hoursRepo as any,
    itemRepo as any,
    variantRepo as any,
    optionRepo as any,
    { findByCode: jest.fn() } as any,
    { emitToRestaurant: jest.fn() } as any,
    { sendToRestaurant: jest.fn(() => Promise.resolve()) } as any,
    undefined,
    categoryRepo as any,
  );
  const storefront = new GetRestaurantBySlugUseCase(
    restaurantRepo as any,
    categoryRepo as any,
    itemRepo as any,
    variantRepo as any,
    optionRepo as any,
    hoursRepo as any,
    { findByRestaurantId: jest.fn(() => null) } as any,
  );
  return { items, checkout, storefront, orderRepo };
}
function input(menuItemId: string, ids: string[]) {
  return {
    items: [{ menuItemId, selectedOptionIds: ids, quantity: 1, notes: '' }],
    customerName: 'Test',
    customerPhone: '000',
    deliveryType: 'pickup' as any,
    paymentMethod: 'cash',
    notes: '',
  };
}

describe('shared flavor source, publication and checkout', () => {
  it.each([
    ['quarter', 2],
    ['half', 3],
    ['kilo', 4],
  ] as const)(
    'publishes sixteen choices and enforces min/max for %s',
    async (id, max) => {
      const f = fixture();
      const publicMenu = await f.storefront.execute('test');
      expect(publicMenu.ok).toBe(true);
      if (!publicMenu.ok) return;
      const item = publicMenu.value.categories
        .flatMap((c) => c.items)
        .find((i) => i.id === id)!;
      expect(item.options).toHaveLength(16);
      expect(item.optionGroups?.[0]).toMatchObject({
        minSelections: 1,
        maxSelections: max,
        sourceCategoryId: 'source',
      });
      const ids = item.options.map((o) => o.id);
      expect((await f.checkout.execute('test', input(id, []))).ok).toBe(false);
      const valid = await f.checkout.execute(
        'test',
        input(id, ids.slice(0, max)),
      );
      expect(valid.ok).toBe(true);
      if (valid.ok) {
        expect(valid.value.order.total).toBe(100);
        expect(valid.value.items[0].selectedOptions).toHaveLength(max);
      }
      expect(
        (await f.checkout.execute('test', input(id, ids.slice(0, max + 1)))).ok,
      ).toBe(false);
    },
  );

  it('one source toggle changes every pote and rejects a stale cart without rewriting a saved order', async () => {
    const before = fixture();
    const first = resolveSharedMenuOptions(
      before.items[0],
      [],
      [source],
      flavors,
    )[0];
    const saved = await before.checkout.execute(
      'test',
      input('quarter', [first.id]),
    );
    expect(saved.ok).toBe(true);
    const off = flavors.map((f) =>
      f.id === 'flavor-0' ? { ...f, isAvailable: false } : f,
    );
    const after = fixture(undefined, off);
    const menu = await after.storefront.execute('test');
    if (!menu.ok) throw new Error('menu');
    for (const pote of menu.value.categories[0].items) {
      expect(
        pote.options.find((o) => o.sourceItemId === 'flavor-0')?.isAvailable,
      ).toBe(false);
    }
    expect(
      (await after.checkout.execute('test', input('quarter', [first.id]))).ok,
    ).toBe(false);
    if (saved.ok)
      expect(saved.value.items[0].selectedOptions[0].name).toBe('flavor-0');
    expect(
      (await before.checkout.execute('test', input('quarter', [first.id]))).ok,
    ).toBe(true);
  });

  it('does not sell source items separately, include another restaurant or accept another pote option', async () => {
    const f = fixture(undefined, [
      ...flavors,
      product('foreign', 'source', 0, 'r2'),
    ]);
    expect((await f.checkout.execute('test', input('flavor-0', []))).ok).toBe(
      false,
    );
    const halfOption = resolveSharedMenuOptions(
      f.items[1],
      [],
      [source],
      flavors,
    )[0];
    // Shared IDs are intentionally reusable only where the same group/source is configured.
    const outsider = product('ordinary', 'potes');
    const other = fixture([outsider]);
    expect(
      (await other.checkout.execute('test', input('ordinary', [halfOption.id])))
        .ok,
    ).toBe(false);
    expect(
      resolveSharedMenuOptions(f.items[0], [], [source], f.items),
    ).toHaveLength(16);
  });

  it('retains a required group when its source is deleted or empty', () => {
    const pote = product('quarter', 'potes', 2);
    const options = resolveSharedMenuOptions(pote, [], [], []);
    const rules = resolveOptionGroups(pote, [], options, null);
    expect(rules).toHaveLength(1);
    expect(validateOptionSelection(rules, [])).not.toBeNull();
  });

  it('keeps ordinary zero-price products and unconfigured menus purchasable', async () => {
    const zero = { ...product('free', 'potes'), basePrice: 0 };
    const f = fixture([zero], [], [regular]);
    expect((await f.checkout.execute('test', input('free', []))).ok).toBe(true);
    expect(resolveSharedMenuOptions(zero, [], [regular], [])).toEqual([]);
  });
});
