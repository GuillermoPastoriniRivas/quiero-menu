import 'reflect-metadata';
import { Mongoose } from 'mongoose';
import { MenuItemSchema } from '../schemas/menu-item.schema.js';
import { MenuItemVariantSchema } from '../schemas/menu-item-variant.schema.js';
import { MenuItemOptionSchema } from '../schemas/menu-item-option.schema.js';
import { OrderItemSchema } from '../schemas/order-item.schema.js';
import { MenuItemMapper } from './menu-item.mapper.js';
import { MenuItemVariantMapper } from './menu-item-variant.mapper.js';
import { MenuItemOptionMapper } from './menu-item-option.mapper.js';
import { OrderItemMapper } from './order-item.mapper.js';

// Schema casting only: no connect(), real environment or in-memory Mongo process.
const mongoose = new Mongoose();
const Item = mongoose.model('MenuFeatureItem', MenuItemSchema);
const Variant = mongoose.model('MenuFeatureVariant', MenuItemVariantSchema);
const Option = mongoose.model('MenuFeatureOption', MenuItemOptionSchema);
const OrderItem = mongoose.model('MenuFeatureOrderItem', OrderItemSchema);
const id = '111111111111111111111111';
const second = '222222222222222222222222';
const third = '333333333333333333333333';

describe('Carta fácil persistence contracts without a database', () => {
  it('casts every group/component reference and maps additive fields back without loss', () => {
    const doc = new Item({ restaurantId: id, categoryId: second, name: 'Promo', basePrice: 100,
      optionGroups: [{ name: 'Rellenos', groupId: 'fillings', selectionMode: 'quantities', requiredTotal: 6,
        sourceCategoryId: third, variantId: second, optionPriceOverrides: [{ sourceItemId: id, priceDelta: 0 }] }],
      components: [{ slotId: 'drink-1', name: 'Bebida 1', displayOrder: 2, parentVariantId: second, quantity: 1,
        choices: [{ menuItemId: third, variantId: id, priceDelta: 5 }] }],
    });
    expect(doc.validateSync()).toBeUndefined();
    const mapped = MenuItemMapper.toDomain(doc as any);
    expect(mapped.optionGroups![0]).toMatchObject({ groupId: 'fillings', selectionMode: 'quantities', requiredTotal: 6,
      sourceCategoryId: third, variantId: second, optionPriceOverrides: [{ sourceItemId: id, priceDelta: 0 }] });
    expect(mapped.components).toEqual([{ slotId: 'drink-1', name: 'Bebida 1', displayOrder: 2, parentVariantId: second,
      quantity: 1, choices: [{ menuItemId: third, variantId: id, priceDelta: 5 }] }]);
  });

  it('defaults historical variant availability to true and preserves explicit false', () => {
    const available = MenuItemVariantMapper.toDomain(new Variant({ itemId: id, name: 'Chico' }) as any);
    const unavailable = MenuItemVariantMapper.toDomain(new Variant({ itemId: id, name: 'Grande', isAvailable: false }) as any);
    expect(available.isAvailable).toBe(true);
    expect(unavailable.isAvailable).toBe(false);
    expect(MenuItemOptionMapper.toDomain(new Option({ itemId: id, name: 'Extra', optionGroup: 'Extras', groupId: 'extras' }) as any).groupId).toBe('extras');
  });

  it('reads old order snapshots with quantity 1 and no components without repricing them', () => {
    const historic = new OrderItem({ orderId: id, menuItemId: second, menuItemName: 'Old', quantity: 2,
      unitPrice: 123, totalPrice: 246, selectedOptions: [{ optionId: 'source:historic:Sabores:all', name: 'Chocolate', priceDelta: 7 }] });
    const mapped = OrderItemMapper.toDomain(historic as any);
    expect(mapped).toMatchObject({ unitPrice: 123, totalPrice: 246, components: [], selectedOptions: [{ quantity: 1, priceDelta: 7 }] });
  });

  it('round trips independent component snapshots and their structured quantities', () => {
    const components = [{ slotId: 'pastry', slotName: 'Medialunas', quantity: 1, menuItemId: third,
      menuItemName: 'Media docena', variantId: null, variantName: null, priceDelta: 0,
      selectedOptions: [{ optionId: 'oreo', name: 'Oreo', priceDelta: 2, quantity: 4, groupId: 'fillings', groupName: 'Rellenos' }] }];
    const doc = new OrderItem({ orderId: id, menuItemId: second, menuItemName: 'Promo', quantity: 1, unitPrice: 100, totalPrice: 100, components });
    expect(OrderItemMapper.toDomain(doc as any).components).toEqual(components);
  });
});
