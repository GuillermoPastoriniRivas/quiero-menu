import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editorGroupRows, sharedListUses, sourceShadowsLocal, componentIssue } from '../src/components/menu/editor-model.ts';
import { listSignature, saveListRows } from '../src/components/menu/shared-list-save.ts';
import { maintenanceEntries, maintenancePriceChanges, savePriceChanges } from '../src/lib/manual-menu.ts';

const group = (name, variantId = null, sourceCategoryId = null) => ({ groupId: `group-${name}`, name, variantId, sourceCategoryId, minSelections: 0, maxSelections: 0, displayOrder: 0 });
const product = (id, changes = {}) => ({ id, restaurantId: 'local', categoryId: 'products', name: id, basePrice: 100, isAvailable: true, isVisible: true, variants: [], options: [], optionGroups: [], ...changes });
const categories = (items, lists = []) => [{ id: 'products', name: 'Productos', items }, ...lists];

test('stored empty groups stay editable and per-presentation sources are not collapsed', () => {
  const item = product('cafe', { optionGroups: [group('Extras', 'hot', 'hot-list'), group('Extras', 'cold', 'cold-list'), { ...group('Pack'), selectionMode: 'quantities', requiredTotal: 6 }] });
  const rows = editorGroupRows(item);
  assert.equal(rows.length, 3);
  assert.notEqual(rows[0].key, rows[1].key);
  assert.equal(rows[0].rule.sourceCategoryId, 'hot-list');
  assert.equal(rows[1].rule.sourceCategoryId, 'cold-list');
  assert.equal(rows[2].rule.requiredTotal, 6);
  assert.deepEqual(rows.map((r) => r.options), [[], [], []]);
});

test('legacy local groups remain editable without treating resolved source options as local inventory', () => {
  const item = product('pote', { options: [{ id: 'local', optionGroup: 'Salsas', variantId: null }], optionGroups: [group('Sabores', null, 'flavors')], resolvedOptions: [{ id: 'synthetic', optionGroup: 'Sabores', sourceItemId: 'chocolate', variantId: null }] });
  const rows = editorGroupRows(item);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((r) => r.rule.name === 'Salsas').options[0].id, 'local');
  assert.deepEqual(rows.find((r) => r.rule.name === 'Sabores').options, []);
});

test('shared-source protection follows variant scope and usages include hidden products', () => {
  const item = product('cafe', { isVisible: false, optionGroups: [group('Extras', 'cold', 'extras')] });
  assert.equal(sourceShadowsLocal(item, 'Extras', 'cold'), true);
  assert.equal(sourceShadowsLocal(item, 'Extras', 'hot'), false);
  assert.equal(sourceShadowsLocal(product('all', { optionGroups: [group('Extras', null, 'extras')] }), 'Extras', 'hot'), true);
  assert.equal(sharedListUses(categories([item]), 'extras')[0].item.id, 'cafe');
});

test('confirmed list additions/deletions are checkpointed and retries only process failures', async () => {
  const old = { key: 'old', id: 'old', name: 'Vieja', description: '', basePrice: 0, isAvailable: true, removed: true };
  const first = { key: 'first', name: 'Chocolate', description: 'Amargo', basePrice: 20, isAvailable: true };
  const second = { ...first, key: 'second', name: 'Frutilla' };
  const calls = [];
  const checkpoints = [];
  let fail = true;
  const ops = {
    remove: async (id) => { calls.push(`delete:${id}`); },
    update: async (id) => { calls.push(`update:${id}`); },
    create: async ({ name }) => { calls.push(`create:${name}`); if (name === 'Frutilla' && fail) throw new Error('Sin conexión'); return { id: name }; },
  };
  const saved = await saveListRows([old, first, second], ops, (rows) => checkpoints.push(structuredClone(rows)));
  assert.equal(saved.failures.length, 1);
  assert.equal(checkpoints[0].some((r) => r.id === 'old'), false);
  assert.equal(checkpoints[1].find((r) => r.key === 'first').id, 'Chocolate');
  assert.equal(saved.rows.find((r) => r.key === 'first').savedSignature, listSignature(first));
  fail = false; calls.length = 0;
  const retry = await saveListRows(saved.rows, ops, () => {});
  assert.deepEqual(calls, ['create:Frutilla']);
  assert.equal(retry.failures.length, 0);
  assert.equal(retry.rows.length, 2);
});

test('a failed deletion is retained, unchanged rows skipped, successful edits not retried', async () => {
  const row = { key: 'same', id: 'same', name: 'Igual', description: '', basePrice: 0, isAvailable: true };
  const rows = [{ ...row, savedSignature: listSignature(row) }, { ...row, key: 'edit', id: 'edit', name: 'Editada' }, { ...row, key: 'delete', id: 'delete', removed: true }];
  const calls = [];
  const result = await saveListRows(rows, { create: async () => { throw new Error('unexpected'); }, update: async (id) => calls.push(id), remove: async () => { throw new Error('Pendiente'); } }, () => {});
  assert.deepEqual(calls, ['edit']);
  assert.equal(result.rows.find((r) => r.id === 'delete').removed, true);
  assert.ok(result.rows.find((r) => r.id === 'edit').savedSignature);
});

test('maintenance changes target presentation prices, independent availability and local extras, never the parent base', async () => {
  const item = product('cafe', { variants: [{ id: 'hot', name: 'Caliente', priceOverride: 200, isAvailable: false }, { id: 'cold', name: 'Frío', priceOverride: null }], options: [{ id: 'extra', name: 'Leche', optionGroup: 'Extras', variantId: 'cold', priceDelta: 30, isAvailable: true }] });
  const rows = maintenanceEntries(categories([item], [{ id: 'flavors', name: 'Sabores', isOptionSource: true, items: [product('chocolate', { basePrice: 0 })] }]));
  assert.equal(rows.find((r) => r.key === 'variant:hot').available, false);
  assert.equal(rows.find((r) => r.key === 'variant:cold').price, 100);
  assert.equal(rows.find((r) => r.key === 'source:chocolate').shared, true);
  const changes = maintenancePriceChanges(rows, { 'item:cafe': '999', 'variant:hot': '250', 'variant:cold': '150', 'option:extra': '40' });
  assert.deepEqual(changes.map((c) => c.kind), ['variant', 'variant', 'option']);
  const result = await savePriceChanges(changes, async (c) => { if (c.id === 'cold') throw new Error('Pendiente'); });
  assert.deepEqual(result.failed.map(({ change }) => change.key), ['variant:cold']);
});

test('two independent promo slots can choose the same offer; nested promos and invalid variants are rejected', () => {
  const promo = product('promo');
  const coffee = product('coffee', { variants: [{ id: 'hot', name: 'Caliente', priceOverride: 100 }] });
  const catalog = categories([promo, coffee, product('nested', { components: [{ slotId: 'existing' }] })]);
  const slot = (id) => ({ slotId: id, name: id, displayOrder: 0, parentVariantId: null, quantity: 1, choices: [{ menuItemId: 'coffee', variantId: 'hot', priceDelta: 0 }] });
  const slots = [slot('bebida-1'), slot('bebida-2')];
  assert.equal(componentIssue(slots, promo, catalog), '');
  assert.match(componentIssue([{ ...slots[0], choices: [...slots[0].choices, ...slots[0].choices] }], promo, catalog), /repetida dentro/);
  assert.match(componentIssue([{ ...slots[0], choices: [{ menuItemId: 'nested', variantId: null, priceDelta: 0 }] }], promo, catalog), /sin componentes/);
  assert.match(componentIssue([{ ...slots[0], choices: [{ menuItemId: 'coffee', variantId: null, priceDelta: 0 }] }], promo, catalog), /presentación válida/);
  assert.match(componentIssue([{ ...slots[0], quantity: 1.5 }], promo, catalog), /cantidad/);
  assert.match(componentIssue([{ ...slots[0], choices: [{ menuItemId: 'coffee', variantId: 'hot', priceDelta: -1 }] }], promo, catalog), /precio extra/);
});
