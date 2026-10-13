import test from 'node:test';
import assert from 'node:assert/strict';
import { canEditBasePrice, manualEntries, priceChanges, savePriceChanges } from '../src/lib/manual-menu.ts';

const categories = [
  { id: 'pizzas', name: 'Pizzas', items: [
    { id: 'simple', name: 'Muzzarella', basePrice: 9500, itemType: 'simple', variants: [] },
    { id: 'sizes', name: 'Pizza por tamaño', basePrice: 0, itemType: 'variant', variants: [{ name: 'Grande', priceOverride: 12000 }] },
  ] },
  { id: 'flavors', name: 'Sabores', isOptionSource: true, items: [
    { id: 'flavor', name: 'Chocolate', basePrice: 0, itemType: 'simple', variants: [], isOrderable: false },
  ] },
];

test('shared flavors and size-based products never get base-price drafts applied', () => {
  const entries = manualEntries(categories);
  assert.deepEqual(entries.filter(canEditBasePrice).map(({ item }) => item.id), ['simple']);
  assert.deepEqual(priceChanges(entries, { simple: '10000', sizes: '99999', flavor: '100' }), [
    { id: 'simple', name: 'Muzzarella', basePrice: 10000 },
  ]);
});

test('zero is valid, unchanged prices do not write, blank and unsafe prices are rejected', () => {
  const entries = manualEntries(categories);
  assert.deepEqual(priceChanges(entries, { simple: '9500' }), []);
  assert.equal(priceChanges(entries, { simple: '0' })[0].basePrice, 0);
  for (const value of ['', '-1', 'NaN', '9007199254740992']) {
    assert.throws(() => priceChanges(entries, { simple: value }), /Muzzarella/);
  }
});

test('partial price-save failure retains only failures for retry and reports their cause', async () => {
  const changes = [
    { id: 'one', name: 'Primero', basePrice: 100 },
    { id: 'two', name: 'Segundo', basePrice: 200 },
    { id: 'three', name: 'Tercero', basePrice: 300 },
  ];
  const calls = [];
  const result = await savePriceChanges(changes, async ({ id }) => {
    calls.push(id);
    if (id === 'two') throw new Error('Sin conexión');
  });
  assert.deepEqual(calls, ['one', 'two', 'three']);
  assert.deepEqual(result.saved.map(({ id }) => id), ['one', 'three']);
  assert.deepEqual(result.failed, [{ change: changes[1], message: 'Sin conexión' }]);
  const retryCalls = [];
  const retry = await savePriceChanges(result.failed.map(({ change }) => change), async ({ id }) => { retryCalls.push(id); });
  assert.deepEqual(retryCalls, ['two']);
  assert.deepEqual(retry.failed, []);
});
