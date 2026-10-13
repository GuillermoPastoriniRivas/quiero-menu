import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Resolver sólo los imports de estos helpers de UI, sin Next ni requests de red.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '@/lib/menu-options') return { url: new URL('../src/lib/menu-options.ts', import.meta.url).href, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { rebuildCartItem, restoreOrderItems, saveLastOrder, getLastOrder } = await import('../src/lib/repeat-order.ts');
const { cartItemIdentity, serializeCartItem, useCartStore } = await import('../src/stores/cart.store.ts');
const { activeComponentSlots, componentChoiceProduct, componentSelectionIssues, componentSnapshots, productStartingPrice, productUnitPrice, selectedOptionsLabel } = await import('../src/lib/menu-options.ts');

const product = (id, overrides = {}) => ({ id, name: id, isAvailable: true, isVisible: true, isOrderable: true, itemType: 'simple', basePrice: 100,
  options: [], variants: [], optionGroups: [], ...overrides });
const flavors = () => product('ice', { basePrice: 8000,
  optionGroups: [{ groupId: 'flavors', name: 'Sabores', minSelections: 1, maxSelections: 2, selectionMode: 'quantities', requiredTotal: 4, variantId: null, displayOrder: 0 }],
  options: [{ id: 'chocolate', groupId: 'flavors', optionGroup: 'Sabores', name: 'Chocolate', variantId: null, priceDelta: 10, isAvailable: true },
    { id: 'cream', groupId: 'flavors', optionGroup: 'Sabores', name: 'Crema', variantId: null, priceDelta: 5, isAvailable: true }] });
const slot = (slotId, overrides = {}) => ({ slotId, name: slotId, quantity: 2, parentVariantId: null, displayOrder: 0,
  choices: [{ menuItemId: 'ice', variantId: null, priceDelta: 20 }], ...overrides });
const promo = () => product('promo', { itemType: 'combo', basePrice: 1000, components: [slot('first'), slot('second', { quantity: 1, displayOrder: 1 })] });
const optionInput = (optionId, quantity = 1) => ({ groupId: 'flavors', optionId, quantity });
const componentInputs = () => [
  { slotId: 'first', menuItemId: 'ice', selectedOptions: [optionInput('chocolate', 3), optionInput('cream', 1)] },
  { slotId: 'second', menuItemId: 'ice', selectedOptions: [optionInput('cream', 4)] },
];
const saved = (overrides = {}) => ({ menuItemId: 'plain', menuItemName: 'Viejo', quantity: 3, unitPrice: 999, selectedOptionIds: [], selectedOptionNames: [], notes: '', ...overrides });

test('promo: base del hijo incluido; delta y extras multiplican slot.quantity; padre multiplica todo', () => {
  const parent = promo();
  const catalog = [parent, flavors()];
  const own = [optionInput('extra', 2)];
  parent.optionGroups = [{ groupId: 'flavors', name: 'Extras', minSelections: 0, maxSelections: 0, selectionMode: 'quantities', variantId: null, displayOrder: 0 }];
  parent.options = [{ id: 'extra', groupId: 'flavors', optionGroup: 'Extras', name: 'Extra', variantId: null, priceDelta: 7, isAvailable: true }];
  const components = componentInputs();
  assert.deepEqual(componentSelectionIssues(parent.components, components, catalog), []);
  // 1000 + 2*7 + 2*(20 + 3*10 + 5) + (20 + 4*5)
  assert.equal(productUnitPrice(parent, null, own, components, catalog), 1164);
  const rebuilt = rebuildCartItem(saved({ menuItemId: 'promo', selectedOptions: [{ ...own[0], name: 'Extra viejo', priceDelta: 500 }], components: componentSnapshots(parent.components, components, catalog) }), catalog);
  assert.equal(rebuilt.unitPrice * rebuilt.quantity, 3492);
  assert.equal(rebuilt.components[0].selectedOptions[0].quantity, 3);
  assert.equal(rebuilt.components[1].selectedOptions[0].quantity, 4);
});

test('todos los slots activos obligatorios; same product twice válido; slot repetido/inactivo inválido', () => {
  const parent = promo();
  const catalog = [parent, flavors()];
  assert.match(componentSelectionIssues(parent.components, componentInputs().slice(0, 1), catalog).join(' '), /second/);
  assert.deepEqual(componentSelectionIssues(parent.components, componentInputs(), catalog), []);
  assert.ok(componentSelectionIssues(parent.components, [...componentInputs(), componentInputs()[0]], catalog).length > 0);
  assert.match(componentSelectionIssues(parent.components, [...componentInputs(), { slotId: 'removed', menuItemId: 'ice' }], catalog).join(' '), /tamaño/);
  parent.components.push(slot('large-only', { parentVariantId: 'large' }));
  assert.equal(activeComponentSlots(parent, 'small').length, 2);
  assert.equal(activeComponentSlots(parent, 'large').length, 3);
});

test('choices: productos y variantes agotados, ocultos y combos anidados quedan deshabilitados', () => {
  const choice = { menuItemId: 'child', variantId: 'large', priceDelta: 0 };
  const child = product('child', { variants: [{ id: 'small', isAvailable: false }, { id: 'large', isAvailable: true }] });
  assert.equal(componentChoiceProduct(choice, [child]), child);
  assert.equal(componentChoiceProduct({ ...choice, variantId: 'small' }, [child]), undefined);
  assert.equal(componentChoiceProduct({ ...choice, variantId: null }, [child]), undefined);
  for (const changes of [{ isAvailable: false }, { isVisible: false }, { isOrderable: false }, { itemType: 'combo' }, { components: [slot('nested')] }]) {
    assert.equal(componentChoiceProduct(choice, [product('child', { variants: child.variants, ...changes })]), undefined);
  }
});

test('Desde utiliza tamaños disponibles, fallback base y deltas de componentes; no incluye precio del hijo', () => {
  const parent = promo();
  parent.variants = [{ id: 'cheap', priceOverride: 1, isAvailable: false }, { id: 'medium', priceOverride: null }, { id: 'large', priceOverride: 2000 }];
  assert.equal(productStartingPrice(parent, [parent, flavors()]), 1120); // 1000 + 3*(20 + 4*5)
  parent.variants[1].isAvailable = false;
  assert.equal(productStartingPrice(parent, [parent, flavors()]), 2120);
  parent.variants[2].isAvailable = false;
  assert.equal(productStartingPrice(parent, [parent, flavors()]), null);
});

test('Desde no anuncia un combo sin ninguna choice disponible o con opciones obligatorias agotadas', () => {
  const parent = promo();
  assert.equal(productStartingPrice(parent, [parent, product('ice', { isAvailable: false })]), null);
  const child = flavors();
  child.options.forEach(o => { o.isAvailable = false; });
  assert.equal(productStartingPrice(parent, [parent, child]), null);
});

test('identidad canónica independiente del orden; incluye quantities, groupId, slotId y notas sin colisiones', () => {
  const first = saved({ selectedOptions: [{ groupId: 'a', optionId: 'x', quantity: 3 }, { groupId: 'b', optionId: 'x', quantity: 1 }] });
  assert.equal(cartItemIdentity(first), cartItemIdentity({ ...first, quantity: 99, selectedOptions: [...first.selectedOptions].reverse() }));
  for (const selections of [[{ groupId: 'a', optionId: 'x', quantity: 1 }, { groupId: 'b', optionId: 'x', quantity: 3 }], [{ groupId: 'b', optionId: 'x', quantity: 4 }]]) {
    assert.notEqual(cartItemIdentity(first), cartItemIdentity({ ...first, selectedOptions: selections }));
  }
  const catalog = [promo(), flavors()];
  const components = componentSnapshots(catalog[0].components, componentInputs(), catalog);
  const combined = saved({ components });
  assert.equal(cartItemIdentity(combined), cartItemIdentity(saved({ components: [...components].reverse() })));
  assert.notEqual(cartItemIdentity(combined), cartItemIdentity(saved({ components: components.map((c, index) => ({ ...c, slotId: index === 0 ? 'second' : 'first' })) })));
  assert.notEqual(cartItemIdentity(first), cartItemIdentity({ ...first, notes: 'Otro' }));
  assert.notEqual(cartItemIdentity(saved({ menuItemId: 'a|b', variantId: 'c' })), cartItemIdentity(saved({ menuItemId: 'a', variantId: 'b|c' })));
});

test('cart merge sólo configuraciones iguales, subtotal correcto y quantities del padre enteras positivas', () => {
  useCartStore.getState().clear();
  useCartStore.getState().addItem(saved({ unitPrice: 10, quantity: 2 }));
  useCartStore.getState().addItem(saved({ unitPrice: 12, quantity: 1 }));
  assert.equal(useCartStore.getState().items.length, 1);
  assert.equal(useCartStore.getState().subtotal(), 36);
  useCartStore.getState().addItem(saved({ selectedOptions: [{ groupId: 'g', optionId: 'o', quantity: 2 }], quantity: 1, unitPrice: 30 }));
  assert.equal(useCartStore.getState().items.length, 2);
  for (const quantity of [-1, 0, 1.5, NaN]) useCartStore.getState().updateQuantity(0, quantity);
  assert.equal(useCartStore.getState().items[0].quantity, 3);
  useCartStore.getState().updateQuantity(0, 4);
  assert.equal(useCartStore.getState().subtotal(), 78);
  useCartStore.getState().clear();
});

test('checkout serializa un único formato de opciones y componentes; qty del slot no sale del cliente', () => {
  const catalog = [promo(), flavors()];
  const item = saved({ menuItemId: 'promo', selectedOptionIds: ['legacy'], selectedOptions: [{ groupId: 'own', optionId: 'extra', quantity: 2, name: 'Extra', priceDelta: 1 }],
    components: componentSnapshots(catalog[0].components, componentInputs(), catalog) });
  const body = serializeCartItem(item);
  assert.deepEqual(body.selectedOptions, [{ groupId: 'own', optionId: 'extra', quantity: 2 }]);
  assert.equal('selectedOptionIds' in body, false);
  assert.equal('quantity' in body.components[0], false);
  assert.deepEqual(body.components[0].selectedOptions, [optionInput('chocolate', 3), optionInput('cream', 1)]);
  assert.deepEqual(serializeCartItem(saved({ selectedOptionIds: ['old'] })).selectedOptionIds, ['old']);
  assert.equal('selectedOptions' in serializeCartItem(saved({ selectedOptionIds: ['old'] })), false);
  const empty = serializeCartItem(saved({ selectedOptions: [] }));
  assert.equal('selectedOptions' in empty, false);
  assert.equal('selectedOptionIds' in empty, false);
  assert.equal('components' in empty, false);
});

test('repeat-order conserva quantities, renombres y source IDs, pero recalcula precios y cantidades de slots', () => {
  const parent = promo();
  const catalog = [parent, flavors()];
  const item = saved({ menuItemId: 'promo', components: componentSnapshots(parent.components, componentInputs(), catalog) });
  parent.basePrice = 2000;
  parent.components[0].quantity = 3;
  const rebuilt = rebuildCartItem(item, catalog);
  assert.equal(rebuilt.unitPrice, 2205); // 2000 + 3*55 + 40
  assert.equal(rebuilt.quantity, 3);
  assert.equal(rebuilt.components[0].quantity, 3);
  assert.equal(rebuilt.components[0].selectedOptions[0].quantity, 3);
  assert.equal(rebuilt.components[0].selectedOptions[0].priceDelta, 10);
});

test('repeat-order rechaza un renglón completo si una opción/choice/variante falta; no transforma el pedido', () => {
  const parent = promo();
  const catalog = [parent, flavors()];
  const item = saved({ menuItemId: 'promo', components: componentSnapshots(parent.components, componentInputs(), catalog) });
  catalog[1].options[0].isAvailable = false;
  assert.equal(rebuildCartItem(item, catalog), null);
  catalog[1].options[0].isAvailable = true;
  parent.components[1].choices = [];
  assert.equal(rebuildCartItem(item, catalog), null);
  assert.equal(rebuildCartItem(saved({ variantId: 'gone' }), [product('plain')]), null);
  assert.equal(rebuildCartItem(saved({ variantId: 'old' }), [product('plain', { variants: [{ id: 'old', isAvailable: false }] })]), null);
  assert.equal(restoreOrderItems([item, saved()], [...catalog, product('plain')]).rejected, 1);
});

test('repeat-order legacy: opciones sin quantity usan 1, sin components usan []; precios nunca se reutilizan', () => {
  const child = product('plain', { optionGroups: [{ groupId: 'g', name: 'Extras', minSelections: 0, maxSelections: 2, variantId: null, displayOrder: 0 }],
    options: [{ id: 'old', groupId: 'g', name: 'Actual', optionGroup: 'Extras', variantId: null, isAvailable: true, priceDelta: 5 }] });
  const restored = rebuildCartItem(saved({ selectedOptionIds: ['old'] }), [child]);
  assert.equal(restored.unitPrice, 105);
  assert.equal(restored.selectedOptions[0].quantity, 1);
  assert.deepEqual(restored.components, []);
  const oldSnapshot = rebuildCartItem(saved({ selectedOptions: [{ optionId: 'old', name: 'Viejo', priceDelta: 500 }] }), [child]);
  assert.equal(oldSnapshot.selectedOptions[0].groupId, 'g');
  assert.equal(oldSnapshot.selectedOptions[0].name, 'Actual');
  assert.equal(oldSnapshot.unitPrice, 105);
  assert.equal(rebuildCartItem(saved({ selectedOptionIds: ['unknown'] }), [child]), null);
  assert.equal(selectedOptionsLabel([{ optionId: 'x', name: 'Chocolate', priceDelta: 0 }]), '1× Chocolate');
});

test('persistencia local de recompra conserva snapshots completos sin compartir datos con otro slug', () => {
  const storage = new Map();
  globalThis.localStorage = { setItem: (k, v) => storage.set(k, v), getItem: k => storage.get(k) ?? null };
  try {
    const catalog = [promo(), flavors()];
    const order = { items: [saved({ menuItemId: 'promo', components: componentSnapshots(catalog[0].components, componentInputs(), catalog) })], savedAt: '2026-10-13' };
    saveLastOrder('local', order);
    assert.deepEqual(getLastOrder('local'), order);
    assert.equal(getLastOrder('otro'), null);
  } finally { delete globalThis.localStorage; }
});

test('recompra estable sobrevive IDs derivados y nombres de grupo regenerados usando sourceItemId', () => {
  const child = product('plain', { optionGroups: [{ groupId: 'stable', name: 'Nombre nuevo', sourceCategoryId: 'source', minSelections: 1,
    maxSelections: 1, selectionMode: 'quantities', requiredTotal: 3, variantId: null, displayOrder: 0 }],
    options: [{ id: 'generated-new', sourceItemId: 'flavor', groupId: 'stable', name: 'Chocolate actual', optionGroup: 'Nombre nuevo',
      variantId: null, isAvailable: true, priceDelta: 10 }] });
  const restored = rebuildCartItem(saved({ selectedOptions: [{ groupId: 'stable', groupName: 'Nombre viejo', optionId: 'generated-old',
    sourceItemId: 'flavor', name: 'Viejo', quantity: 3, priceDelta: 999 }] }), [child]);
  assert.equal(restored.unitPrice, 130);
  assert.equal(restored.selectedOptions[0].optionId, 'flavor');
  assert.equal(restored.selectedOptions[0].quantity, 3);
  assert.equal(restored.selectedOptions[0].groupName, 'Nombre nuevo');
});
