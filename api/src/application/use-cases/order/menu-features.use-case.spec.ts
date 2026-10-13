import { CreateStorefrontOrderUseCase } from './create-storefront-order.use-case.js';
import { MenuItem } from '../../../domain/entities/menu-item.entity.js';
import { MenuCategory } from '../../../domain/entities/menu-category.entity.js';
import { MenuItemVariant } from '../../../domain/entities/menu-item-variant.entity.js';
import { MenuItemOption } from '../../../domain/entities/menu-item-option.entity.js';
import { MenuItemOptionGroup } from '../../../domain/entities/menu-item-option-group.entity.js';
import type { MenuItemComponent } from '../../../domain/entities/menu-item-component.entity.js';
import { MenuItemType } from '../../../domain/enums/menu-item-type.enum.js';
import { DeliveryType } from '../../../domain/enums/delivery-type.enum.js';
import { effectiveGroupId } from '../../../domain/services/menu-option-groups.js';
import { resolveSharedMenuOptions } from '../../../domain/services/shared-menu-options.js';

const product = (
  id: string,
  groups: MenuItemOptionGroup[] = [],
  components: MenuItemComponent[] = [],
) =>
  new MenuItem(
    id,
    'r1',
    'c1',
    id,
    '',
    100,
    '',
    0,
    true,
    true,
    MenuItemType.SIMPLE,
    groups,
    components,
  );
const group = (
  mode: 'single' | 'multiple' | 'quantities',
  min = 0,
  max = 0,
  total: number | null = null,
  variantId: string | null = null,
) =>
  new MenuItemOptionGroup(
    'Rellenos',
    min,
    max,
    variantId,
    0,
    'group',
    null,
    'fillings',
    mode,
    total,
  );
const option = (id: string, price = 0, variantId: string | null = null) =>
  new MenuItemOption(
    id,
    'pack',
    variantId,
    id,
    price,
    'Rellenos',
    true,
    undefined,
    undefined,
    '',
    'fillings',
  );

function fixture() {
  const categories = [
    new MenuCategory('c1', 'r1', 'Carta', '', 0, true),
    new MenuCategory('s1', 'r1', 'Sabores', '', 1, false, true),
  ];
  const items = [
    product('pack', [
      group('quantities', 1, 0, 6),
      group('quantities', 1, 0, 12, 'v12'),
    ]),
    product('coffee'),
  ];
  const variants = [
    new MenuItemVariant('v6', 'pack', 'Media docena', 100, 1),
    new MenuItemVariant('v12', 'pack', 'Docena', 200, 1),
  ];
  const options = [option('oreo', 2), option('tiramisu', 3)];
  const itemRepo = {
    findById: jest.fn((id: string) =>
      Promise.resolve(items.find((item) => item.id === id) ?? null),
    ),
    findByRestaurantId: jest.fn(() => Promise.resolve(items)),
  };
  const orderRepo = {
    generateNextCode: jest.fn(() => Promise.resolve('TEST')),
    findByTrackingToken: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((data: object) =>
      Promise.resolve({ id: 'order', ...data }),
    ),
  };
  const orderItemRepo = {
    createBulk: jest.fn((rows: object[]) =>
      Promise.resolve(rows.map((row, i) => ({ id: String(i), ...row }))),
    ),
  };
  const checkout = new CreateStorefrontOrderUseCase(
    orderRepo as any,
    orderItemRepo as any,
    {
      findBySlug: jest.fn(() =>
        Promise.resolve({
          id: 'r1',
          status: 'active',
          phone: '000',
          timezone: 'UTC',
          openOverride: 'open',
        }),
      ),
    } as any,
    { findByRestaurantId: jest.fn(() => Promise.resolve([])) } as any,
    itemRepo as any,
    {
      findByItemId: jest.fn((id: string) =>
        Promise.resolve(variants.filter((v) => v.itemId === id)),
      ),
      findByItemIds: jest.fn((ids: string[]) =>
        Promise.resolve(variants.filter((v) => ids.includes(v.itemId))),
      ),
    } as any,
    {
      findByItemId: jest.fn((id: string) =>
        Promise.resolve(options.filter((o) => o.itemId === id)),
      ),
    } as any,
    { findByCode: jest.fn() } as any,
    { emitToRestaurant: jest.fn() } as any,
    { sendToRestaurant: jest.fn(() => Promise.resolve()) } as any,
    undefined,
    { findByRestaurantId: jest.fn(() => Promise.resolve(categories)) } as any,
  );
  return {
    checkout,
    items,
    variants,
    options,
    categories,
    orderRepo,
    orderItemRepo,
  };
}

const filling = (optionId: string, quantity: number) => ({
  groupId: 'fillings',
  optionId,
  quantity,
});
function request(item: object) {
  return {
    items: [
      { menuItemId: 'pack', variantId: 'v6', quantity: 1, notes: '', ...item },
    ],
    customerName: 'Test',
    customerPhone: '000',
    deliveryType: DeliveryType.PICKUP,
    paymentMethod: 'cash',
    notes: '',
  };
}

describe('Carta fácil checkout: quantities, availability, prices and snapshots', () => {
  it('prices 4 Oreo + 2 Tiramisú per pack, then multiplies the product quantity', async () => {
    const f = fixture();
    const result = await f.checkout.execute(
      'test',
      request({
        quantity: 2,
        selectedOptions: [filling('oreo', 4), filling('tiramisu', 2)],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order.subtotal).toBe(228);
    expect(result.value.items[0]).toMatchObject({
      unitPrice: 114,
      totalPrice: 228,
      variantName: 'Media docena',
      components: [],
    });
    expect(result.value.items[0].selectedOptions).toEqual([
      {
        optionId: 'oreo',
        name: 'oreo',
        priceDelta: 2,
        quantity: 4,
        groupId: 'fillings',
        groupName: 'Rellenos',
      },
      {
        optionId: 'tiramisu',
        name: 'tiramisu',
        priceDelta: 3,
        quantity: 2,
        groupId: 'fillings',
        groupName: 'Rellenos',
      },
    ]);
    expect(decodeURIComponent(result.value.whatsappUrl)).toContain(
      '4x oreo, 2x tiramisu',
    );
    f.options[0] = {
      ...f.options[0],
      name: 'Renamed',
      priceDelta: 100,
      isAvailable: false,
    };
    expect(result.value.items[0].selectedOptions[0]).toMatchObject({
      name: 'oreo',
      priceDelta: 2,
      quantity: 4,
    });
  });

  it('uses requiredTotal for the selected presentation, not a global variant selection cap', async () => {
    const f = fixture();
    expect(
      (
        await f.checkout.execute(
          'test',
          request({ variantId: 'v12', selectedOptions: [filling('oreo', 12)] }),
        )
      ).ok,
    ).toBe(true);
    expect(
      (
        await f.checkout.execute(
          'test',
          request({ variantId: 'v12', selectedOptions: [filling('oreo', 6)] }),
        )
      ).ok,
    ).toBe(false);
  });

  it.each([
    [],
    [filling('oreo', 5)],
    [filling('oreo', 7)],
    [filling('oreo', 4.5), filling('tiramisu', 1.5)],
    [filling('oreo', -1), filling('tiramisu', 7)],
    [filling('oreo', 0), filling('tiramisu', 6)],
    [filling('oreo', 3), filling('oreo', 3)],
    [{ ...filling('oreo', 6), groupId: 'other' }],
    [filling('missing', 6)],
  ])(
    'rejects invalid units, duplicate identities or references: %j',
    async (...selectedOptions) => {
      const f = fixture();
      const result = await f.checkout.execute(
        'test',
        request({ selectedOptions }),
      );
      expect(result.ok).toBe(false);
      expect(f.orderRepo.create).not.toHaveBeenCalled();
      expect(f.orderItemRepo.createBulk).not.toHaveBeenCalled();
    },
  );

  it('keeps variety limits distinct from total units and permits an optional empty quantity group', async () => {
    const f = fixture();
    f.items[0] = product('pack', [group('quantities', 2, 2, 6)]);
    expect(
      (
        await f.checkout.execute(
          'test',
          request({ selectedOptions: [filling('oreo', 6)] }),
        )
      ).ok,
    ).toBe(false);
    expect(
      (
        await f.checkout.execute(
          'test',
          request({
            selectedOptions: [filling('oreo', 4), filling('tiramisu', 2)],
          }),
        )
      ).ok,
    ).toBe(true);
    f.items[0] = product('pack', [group('quantities', 0, 1, 6)]);
    expect(
      (await f.checkout.execute('test', request({ selectedOptions: [] }))).ok,
    ).toBe(true);
    expect(
      (
        await f.checkout.execute(
          'test',
          request({ selectedOptions: [filling('oreo', 1)] }),
        )
      ).ok,
    ).toBe(false);
  });

  it.each(['single', 'multiple'] as const)(
    'requires quantity 1 in %s groups and preserves the old ID payload',
    async (mode) => {
      const f = fixture();
      f.items[0] = product('pack', [group(mode, 0, mode === 'single' ? 1 : 2)]);
      expect(
        (
          await f.checkout.execute(
            'test',
            request({ selectedOptions: [filling('oreo', 2)] }),
          )
        ).ok,
      ).toBe(false);
      expect(
        (
          await f.checkout.execute(
            'test',
            request({ selectedOptionIds: ['oreo'] }),
          )
        ).ok,
      ).toBe(true);
      expect(
        (
          await f.checkout.execute(
            'test',
            request({
              selectedOptionIds: ['oreo'],
              selectedOptions: [filling('tiramisu', 1)],
            }),
          )
        ).ok,
      ).toBe(false);
      if (mode === 'single')
        expect(
          (
            await f.checkout.execute(
              'test',
              request({ selectedOptionIds: ['oreo', 'tiramisu'] }),
            )
          ).ok,
        ).toBe(false);
    },
  );

  it('rejects a stale unavailable variant or option and invalid product quantities', async () => {
    const f = fixture();
    const input = request({ selectedOptions: [filling('oreo', 6)] });
    f.variants[0] = { ...f.variants[0], isAvailable: false };
    expect((await f.checkout.execute('test', input)).ok).toBe(false);
    f.variants[0] = { ...f.variants[0], isAvailable: true };
    f.options[0] = { ...f.options[0], isAvailable: false };
    expect((await f.checkout.execute('test', input)).ok).toBe(false);
    for (const quantity of [0, -1, 1.5])
      expect((await f.checkout.execute('test', request({ quantity }))).ok).toBe(
        false,
      );
  });

  it('accepts stable source IDs or synthetic legacy IDs, preserves source surcharge and contextual zero', async () => {
    const f = fixture();
    const rule = new MenuItemOptionGroup(
      'Sabores',
      1,
      1,
      null,
      0,
      'group',
      's1',
      'flavors',
      'single',
    );
    const pote = product('pote', [rule]);
    const source = { ...product('flavor'), categoryId: 's1', basePrice: 50 };
    f.items.push(pote, source);
    const synthetic = resolveSharedMenuOptions(
      pote,
      [],
      f.categories,
      f.items,
    )[0].id;
    for (const selection of [
      {
        selectedOptions: [
          { groupId: 'flavors', optionId: 'flavor', quantity: 1 },
        ],
      },
      { selectedOptionIds: [synthetic] },
    ]) {
      const result = await f.checkout.execute(
        'test',
        request({ menuItemId: 'pote', variantId: undefined, ...selection }),
      );
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(result.value.items[0]).toMatchObject({
          unitPrice: 150,
          selectedOptions: [{ optionId: 'flavor', sourceItemId: 'flavor' }],
        });
    }
    f.items[f.items.indexOf(pote)] = product('pote', [
      {
        ...rule,
        optionPriceOverrides: [{ sourceItemId: 'flavor', priceDelta: 0 }],
      },
    ]);
    const free = await f.checkout.execute(
      'test',
      request({
        menuItemId: 'pote',
        variantId: undefined,
        selectedOptionIds: [synthetic],
      }),
    );
    expect(free.ok).toBe(true);
    if (free.ok) expect(free.value.items[0].unitPrice).toBe(100);
    f.items[f.items.indexOf(source)] = { ...source, isAvailable: false };
    expect(
      (
        await f.checkout.execute(
          'test',
          request({
            menuItemId: 'pote',
            variantId: undefined,
            selectedOptionIds: [synthetic],
          }),
        )
      ).ok,
    ).toBe(false);
    expect(effectiveGroupId({ name: 'Sabores' })).toBe(
      effectiveGroupId({ name: 'Sabores' }),
    );
  });
});

function promoFixture() {
  const f = fixture();
  f.variants.push(
    new MenuItemVariant('hot', 'coffee', 'Caliente', 9000, 1),
    new MenuItemVariant('cold', 'coffee', 'Frío', 12000, 1),
  );
  f.items[1] = product('coffee', [
    new MenuItemOptionGroup(
      'Extras',
      0,
      1,
      'cold',
      0,
      'group',
      null,
      'extras',
      'single',
    ),
  ]);
  f.options.push(
    new MenuItemOption(
      'cream',
      'coffee',
      'cold',
      'Crema',
      20,
      'Extras',
      true,
      undefined,
      undefined,
      '',
      'extras',
    ),
  );
  const choices = [
    { menuItemId: 'coffee', variantId: 'hot', priceDelta: 0 },
    { menuItemId: 'coffee', variantId: 'cold', priceDelta: 5 },
  ];
  f.items.push({
    ...product(
      'promo',
      [],
      [
        {
          slotId: 'drink-1',
          name: 'Bebida 1',
          quantity: 1,
          displayOrder: 0,
          parentVariantId: null,
          choices,
        },
        {
          slotId: 'drink-2',
          name: 'Bebida 2',
          quantity: 1,
          displayOrder: 1,
          parentVariantId: null,
          choices,
        },
        {
          slotId: 'pastries',
          name: 'Medialunas',
          quantity: 1,
          displayOrder: 2,
          parentVariantId: null,
          choices: [{ menuItemId: 'pack', variantId: 'v6', priceDelta: 0 }],
        },
      ],
    ),
    basePrice: 500,
  });
  const componentInput = [
    {
      slotId: 'drink-1',
      menuItemId: 'coffee',
      variantId: 'cold',
      selectedOptions: [{ groupId: 'extras', optionId: 'cream', quantity: 1 }],
    },
    { slotId: 'drink-2', menuItemId: 'coffee', variantId: 'hot' },
    {
      slotId: 'pastries',
      menuItemId: 'pack',
      variantId: 'v6',
      selectedOptions: [filling('oreo', 4), filling('tiramisu', 2)],
    },
  ];
  const input = request({
    menuItemId: 'promo',
    variantId: undefined,
    quantity: 2,
    components: componentInput,
  });
  return { ...f, input, componentInput };
}

describe('Promo slots: independent choices, bounded references and authoritative inventory', () => {
  it('adds parent options and resolves slots for the selected promo presentation', async () => {
    const f = promoFixture();
    f.variants.push(
      new MenuItemVariant('promo-large', 'promo', 'Grande', 600, 1),
    );
    f.items[2] = {
      ...f.items[2],
      optionGroups: [
        new MenuItemOptionGroup(
          'Extras promo',
          0,
          1,
          null,
          0,
          'group',
          null,
          'promo-extras',
          'single',
        ),
      ],
      components: [
        ...f.items[2].components!,
        {
          ...f.items[2].components![0],
          parentVariantId: 'promo-large',
          quantity: 2,
        },
      ],
    };
    f.options.push(
      new MenuItemOption(
        'promo-extra',
        'promo',
        null,
        'Extra promo',
        7,
        'Extras promo',
        true,
        undefined,
        undefined,
        '',
        'promo-extras',
      ),
    );
    const result = await f.checkout.execute(
      'test',
      request({
        menuItemId: 'promo',
        variantId: 'promo-large',
        selectedOptions: [
          { groupId: 'promo-extras', optionId: 'promo-extra', quantity: 1 },
        ],
        components: f.componentInput,
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items[0].unitPrice).toBe(671);
      expect(result.value.items[0].components[0].quantity).toBe(2);
    }
  });

  it('prices only parent + slot surcharges, snapshots each slot and formats quantities', async () => {
    const f = promoFixture();
    const result = await f.checkout.execute('test', f.input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.items[0]).toMatchObject({
      unitPrice: 539,
      totalPrice: 1078,
      components: [
        {
          slotId: 'drink-1',
          slotName: 'Bebida 1',
          quantity: 1,
          variantName: 'Frío',
          priceDelta: 5,
          selectedOptions: [{ name: 'Crema', quantity: 1 }],
        },
        { slotId: 'drink-2', variantName: 'Caliente', selectedOptions: [] },
        {
          slotId: 'pastries',
          variantName: 'Media docena',
          selectedOptions: [
            { name: 'oreo', quantity: 4 },
            { name: 'tiramisu', quantity: 2 },
          ],
        },
      ],
    });
    expect(decodeURIComponent(result.value.whatsappUrl)).toContain(
      'Bebida 1: 1x coffee (Frío) [1x Crema]',
    );
  });

  it('allows the same product and option in different slots, and multiplies a repeated slot configuration', async () => {
    const f = promoFixture();
    f.componentInput[1] = { ...f.componentInput[0], slotId: 'drink-2' };
    f.items[2] = {
      ...f.items[2],
      components: f.items[2].components!.map((slot) =>
        slot.slotId === 'drink-1' ? { ...slot, quantity: 2 } : slot,
      ),
    };
    const result = await f.checkout.execute('test', f.input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.items[0].unitPrice).toBe(589);
  });

  it.each([
    'missing',
    'duplicate',
    'foreign',
    'bad-variant',
    'hot-extra',
    'bad-total',
    'unknown-slot',
  ])('rejects %s before writing the order', async (scenario) => {
    const f = promoFixture();
    if (scenario === 'missing') f.componentInput.pop();
    if (scenario === 'duplicate')
      f.componentInput[1] = { ...f.componentInput[0] };
    if (scenario === 'foreign')
      f.componentInput[0].menuItemId = 'other-restaurant';
    if (scenario === 'bad-variant') f.componentInput[0].variantId = 'v6';
    if (scenario === 'hot-extra') f.componentInput[0].variantId = 'hot';
    if (scenario === 'bad-total')
      f.componentInput[2].selectedOptions = [filling('oreo', 5)];
    if (scenario === 'unknown-slot') f.componentInput[0].slotId = 'unknown';
    expect((await f.checkout.execute('test', f.input)).ok).toBe(false);
    expect(f.orderRepo.create).not.toHaveBeenCalled();
  });

  it.each(['item', 'variant', 'option', 'nested', 'source', 'restaurant'])(
    'revalidates component %s at checkout',
    async (scenario) => {
      const f = promoFixture();
      if (scenario === 'item')
        f.items[1] = { ...f.items[1], isAvailable: false };
      if (scenario === 'variant')
        f.variants[3] = { ...f.variants[3], isAvailable: false };
      if (scenario === 'option')
        f.options[2] = { ...f.options[2], isAvailable: false };
      if (scenario === 'nested')
        f.items[1] = { ...f.items[1], components: f.items[2].components };
      if (scenario === 'source')
        f.items[1] = { ...f.items[1], categoryId: 's1' };
      if (scenario === 'restaurant')
        f.items[1] = { ...f.items[1], restaurantId: 'r2' };
      expect((await f.checkout.execute('test', f.input)).ok).toBe(false);
      expect(f.orderRepo.create).not.toHaveBeenCalled();
    },
  );
});
