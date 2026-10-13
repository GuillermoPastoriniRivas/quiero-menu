import {
  CreateVariantRequestSchema,
  UpdateVariantRequestSchema,
  UpdateOptionGroupsRequestSchema,
  UpdateComponentsRequestSchema,
  CreateOptionRequestSchema,
} from './menu.dto.js';
import { CreateStorefrontOrderRequestSchema } from './order.dto.js';

describe('Carta fácil DTO contracts', () => {
  it('preserves variant availability, defaults true and allows a zero final presentation price', () => {
    expect(
      CreateVariantRequestSchema.parse({ name: 'Gratis', priceOverride: 0 })
        .isAvailable,
    ).toBe(true);
    expect(UpdateVariantRequestSchema.parse({ isAvailable: false })).toEqual({
      isAvailable: false,
    });
    expect(
      CreateVariantRequestSchema.safeParse({
        name: 'Invalid',
        priceOverride: -1,
      }).success,
    ).toBe(false);
    expect(
      CreateOptionRequestSchema.parse({
        name: 'Extra',
        optionGroup: 'Extras',
        groupId: 'extras',
      }).groupId,
    ).toBe('extras');
  });

  it('does not strip group modes, totals or context price overrides', () => {
    const group = {
      name: 'Rellenos',
      groupId: 'fillings',
      selectionMode: 'quantities',
      requiredTotal: 6,
      sourceCategoryId: '111111111111111111111111',
      optionPriceOverrides: [
        { sourceItemId: '222222222222222222222222', priceDelta: 0 },
      ],
    };
    expect(
      UpdateOptionGroupsRequestSchema.parse({ groups: [group] }).groups[0],
    ).toMatchObject(group);
  });

  it('accepts separate promo slots, rejects fractional configured quantities', () => {
    const slot = {
      slotId: 'drink-1',
      name: 'Bebida 1',
      quantity: 1,
      choices: [
        {
          menuItemId: '111111111111111111111111',
          variantId: '222222222222222222222222',
          priceDelta: 5,
        },
      ],
    };
    expect(
      UpdateComponentsRequestSchema.parse({ components: [slot] }).components[0],
    ).toMatchObject({ ...slot, parentVariantId: null });
    expect(
      UpdateComponentsRequestSchema.safeParse({
        components: [{ ...slot, quantity: 1.5 }],
      }).success,
    ).toBe(false);
  });

  const order = {
    items: [{ menuItemId: 'item', quantity: 1 }],
    customerName: 'Test',
    customerPhone: '000',
    deliveryType: 'pickup',
  };
  const selection = [{ groupId: 'fillings', optionId: 'oreo', quantity: 6 }];
  it('keeps old requests and new quantities/components while rejecting ambiguous payloads', () => {
    expect(
      CreateStorefrontOrderRequestSchema.parse(order).items[0]
        .selectedOptionIds,
    ).toEqual([]);
    const components = [
      { slotId: 'drink-1', menuItemId: 'coffee', selectedOptions: selection },
    ];
    const parsed = CreateStorefrontOrderRequestSchema.parse({
      ...order,
      items: [{ ...order.items[0], selectedOptions: selection, components }],
    });
    expect(parsed.items[0]).toMatchObject({
      selectedOptions: selection,
      components,
    });
    expect(
      CreateStorefrontOrderRequestSchema.safeParse({
        ...order,
        items: [
          {
            ...order.items[0],
            selectedOptions: selection,
            selectedOptionIds: ['old'],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it.each([0, -1, 1.5])(
    'rejects invalid product and option quantities: %s',
    (quantity) => {
      expect(
        CreateStorefrontOrderRequestSchema.safeParse({
          ...order,
          items: [{ ...order.items[0], quantity }],
        }).success,
      ).toBe(false);
      expect(
        CreateStorefrontOrderRequestSchema.safeParse({
          ...order,
          items: [
            {
              ...order.items[0],
              selectedOptions: [{ ...selection[0], quantity }],
            },
          ],
        }).success,
      ).toBe(false);
    },
  );
});
