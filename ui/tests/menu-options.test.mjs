import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeOptionRule, productOptionGroups, reconcileProductOptions, selectionIssues, toggleProductOption,
  optionsPrice, reconcileOptionSelections, selectedInGroup, selectedUnitsInGroup, setProductOptionQuantity, selectedOptionSnapshots } from '../src/lib/menu-options.ts';

const option = (id, group = 'Sabores', variantId = null, isAvailable = true) => ({ id, name: id, optionGroup: group, variantId, isAvailable });
const item = (optionGroups = []) => ({ options: [option('chocolate'), option('frutilla'), option('crema', 'Premium')], variants: [{ id: 'small', maxSelections: 1 }, { id: 'large', maxSelections: 4 }], optionGroups });
const rule = (minSelections, maxSelections, variantId = null) => ({ name: 'Sabores', minSelections, maxSelections, variantId, displayOrder: 0, selectionScope: 'group' });

test('legacy: cambiar a un tamaño chico conserva su tope total entre grupos', () => {
  const small = productOptionGroups(item(), 'small');
  const large = productOptionGroups(item(), 'large');
  assert.deepEqual(toggleProductOption(small, ['chocolate'], 'frutilla'), ['frutilla']);
  assert.deepEqual(toggleProductOption(small, ['chocolate'], 'crema'), ['crema']);
  assert.deepEqual(toggleProductOption(large, ['chocolate'], 'crema'), ['chocolate', 'crema']);
  assert.match(selectionIssues(small, ['chocolate', 'crema']).join(' '), /en total/);
});

test('una regla específica reemplaza la general y una elección única se reemplaza en un toque', () => {
  const groups = productOptionGroups(item([rule(2, 3), rule(1, 1, 'small')]), 'small');
  assert.equal(groups[0].minSelections, 1);
  assert.deepEqual(toggleProductOption(groups, ['chocolate'], 'frutilla'), ['frutilla']);
  assert.deepEqual(selectionIssues(groups, ['frutilla']), []);
});

test('reglas explícitas de una API anterior mantienen el alcance por grupo', () => {
  const oldRule = { ...rule(1, 1), selectionScope: undefined };
  assert.equal(productOptionGroups(item([oldRule]), 'small')[0].selectionScope, 'group');
});

test('muestra cuántas faltan, no acepta agotadas y conserva el aviso de un grupo agotado', () => {
  const product = { ...item([rule(2, 3)]), options: [option('chocolate'), option('agotada', 'Sabores', null, false)] };
  const groups = productOptionGroups(product, 'large');
  assert.match(selectionIssues(groups, ['chocolate'])[0], /No hay suficientes/);
  assert.deepEqual(toggleProductOption(groups, [], 'agotada'), []);
  const available = productOptionGroups(item([rule(2, 3)]), 'large');
  assert.equal(selectionIssues(available, ['chocolate'])[0], 'Te falta 1 opción en Sabores.');
});

test('las reglas de grupos eliminados y opciones de otros tamaños no bloquean', () => {
  const groups = productOptionGroups({ ...item([{ ...rule(1, 1), name: 'Borrado' }]), options: [option('solo-grande', 'Sabores', 'large')] }, 'small');
  assert.deepEqual(groups, []);
});

test('etiquetas de exacto, rango, mínimo y opcional', () => {
  assert.equal(describeOptionRule(2, 2), 'Elegí 2');
  assert.equal(describeOptionRule(2, 4), 'Elegí entre 2 y 4');
  assert.equal(describeOptionRule(2, 0), 'Elegí al menos 2');
  assert.equal(describeOptionRule(0, 4), 'Elegí hasta 4');
});

test('al reducir tamaño conserva la primera selección compatible, sin exceder el máximo', () => {
  assert.deepEqual(reconcileProductOptions(productOptionGroups(item(), 'small'), ['chocolate', 'frutilla', 'chocolate', 'inexistente']), ['chocolate']);
});

test('una fuente compartida vacía conserva el mínimo y bloquea un pote sin sabores', () => {
  const product = { options: [], variants: [], optionGroups: [{ ...rule(1, 2), sourceCategoryId: 'source' }] };
  const groups = productOptionGroups(product, null);
  assert.equal(groups.length, 1);
  assert.match(selectionIssues(groups, [])[0], /No hay suficientes/);
});

test('la regla específica de una fuente compartida no duplica las opciones generales', () => {
  const product = { ...item(), optionGroups: [{ ...rule(1, 4), sourceCategoryId: 'source' }, { ...rule(1, 2, 'small'), sourceCategoryId: 'source' }],
    options: [{ ...option('all'), sourceItemId: 'chocolate' }, { ...option('small', 'Sabores', 'small'), sourceItemId: 'chocolate' }] };
  const groups = productOptionGroups(product, 'small');
  assert.deepEqual(groups[0].options.map(o => o.id), ['small']);
});

const quantityProduct = (min = 1) => ({ ...item(), optionGroups: [{ ...rule(min, 2), groupId: 'flavors', selectionMode: 'quantities', requiredTotal: 4 }],
  options: [{ ...option('chocolate'), groupId: 'flavors', priceDelta: 10 }, { ...option('frutilla'), groupId: 'flavors', priceDelta: 5 }] });
const selection = (optionId, quantity, groupId = 'flavors') => ({ groupId, optionId, quantity });

test('cantidades: min/max cuentan opciones distintas, requiredTotal suma unidades y precio multiplica cantidades', () => {
  const groups = productOptionGroups(quantityProduct(), null);
  const selected = [selection('chocolate', 3), selection('frutilla', 1)];
  assert.equal(selectedInGroup(groups[0], selected), 2);
  assert.equal(selectedUnitsInGroup(groups[0], selected), 4);
  assert.deepEqual(selectionIssues(groups, selected), []);
  assert.equal(optionsPrice(groups, selected), 35);
  assert.match(selectionIssues(groups, [selection('chocolate', 3)]).join(' '), /Completá 4/);
});

test('cantidades opcionales: vacío válido; cualquier selección debe completar la suma exacta', () => {
  const groups = productOptionGroups(quantityProduct(0), null);
  assert.deepEqual(selectionIssues(groups, []), []);
  assert.match(selectionIssues(groups, [selection('chocolate', 1)]).join(' '), /Completá 4/);
  assert.deepEqual(selectionIssues(groups, [selection('chocolate', 4)]), []);
});

test('valida enteros, duplicados, opciones inexistentes y agotadas sin descartarlas silenciosamente', () => {
  const groups = productOptionGroups(quantityProduct(), null);
  for (const quantity of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.match(selectionIssues(groups, [selection('chocolate', quantity)]).join(' '), /enteros/);
    assert.deepEqual(setProductOptionQuantity(groups, [], 'flavors', 'chocolate', quantity), []);
  }
  assert.match(selectionIssues(groups, [selection('chocolate', 2), selection('chocolate', 2)]).join(' '), /repetida/);
  assert.match(selectionIssues(groups, [selection('inexistente', 4)]).join(' '), /disponible/);
  groups[0].options[0].isAvailable = false;
  assert.match(selectionIssues(groups, [selection('chocolate', 4)]).join(' '), /disponible/);
});

test('controles respetan el total y el tope distinto; permiten quitar y redistribuir cantidades', () => {
  const product = quantityProduct();
  product.options.push({ ...option('crema'), groupId: 'flavors', priceDelta: 0 });
  const groups = productOptionGroups(product, null);
  let selected = setProductOptionQuantity(groups, [], 'flavors', 'chocolate', 3);
  selected = setProductOptionQuantity(groups, selected, 'flavors', 'frutilla', 1);
  assert.equal(setProductOptionQuantity(groups, selected, 'flavors', 'chocolate', 4), selected);
  assert.equal(setProductOptionQuantity(groups, selected, 'flavors', 'crema', 1), selected);
  selected = setProductOptionQuantity(groups, selected, 'flavors', 'frutilla', 0);
  assert.deepEqual(setProductOptionQuantity(groups, selected, 'flavors', 'crema', 1), [selection('chocolate', 3), selection('crema', 1)]);
});

test('mismo nombre de grupo y misma fuente en dos groupId mantienen elección y sobreprecio independientes', () => {
  const product = { options: [
    { ...option('generated-a'), groupId: 'a', sourceItemId: 'flavor', priceDelta: 100 },
    { ...option('generated-b'), groupId: 'b', sourceItemId: 'flavor', priceDelta: 100 },
  ], variants: [], optionGroups: [
    { ...rule(1, 1), groupId: 'a', sourceCategoryId: 'source', optionPriceOverrides: [{ sourceItemId: 'flavor', priceDelta: 2 }] },
    { ...rule(1, 1), groupId: 'b', sourceCategoryId: 'source', optionPriceOverrides: [{ sourceItemId: 'flavor', priceDelta: 7 }] },
  ] };
  const groups = productOptionGroups(product, null);
  assert.equal(groups.length, 2);
  let selected = setProductOptionQuantity(groups, [], 'a', 'flavor', 1);
  assert.equal(selected.length, 1);
  assert.ok(selectionIssues(groups, selected).length > 0);
  selected = setProductOptionQuantity(groups, selected, 'b', 'flavor', 1);
  assert.deepEqual(selectionIssues(groups, selected), []);
  assert.equal(optionsPrice(groups, selected), 9);
  assert.deepEqual(selectedOptionSnapshots(groups, selected).map(o => [o.groupId, o.optionId, o.sourceItemId]), [['a', 'flavor', 'flavor'], ['b', 'flavor', 'flavor']]);
});

test('cambio de tamaño conserva cantidades y bloquea suma incompatible en vez de convertirlas en unidades de 1', () => {
  const groups = productOptionGroups(quantityProduct(), null);
  groups[0].requiredTotal = 2;
  const selected = [selection('chocolate', 3)];
  assert.deepEqual(reconcileOptionSelections(groups, selected), selected);
  assert.match(selectionIssues(groups, selected).join(' '), /Completá 2/);
  groups[0].selectionMode = 'multiple';
  assert.deepEqual(reconcileOptionSelections(groups, selected), []);
  assert.match(selectionIssues(groups, selected).join(' '), /una sola vez/);
});

test('selectionMode single reemplaza una elección aun cuando el max legacy no sea 1', () => {
  const groups = productOptionGroups(quantityProduct(0), null);
  groups[0].selectionMode = 'single';
  groups[0].maxSelections = 0;
  const initial = [selection('chocolate', 1)];
  assert.deepEqual(setProductOptionQuantity(groups, initial, 'flavors', 'frutilla', 1), [selection('frutilla', 1)]);
  assert.match(selectionIssues(groups, [...initial, selection('frutilla', 1)]).join(' '), /una sola opción/);
});

test('opción legacy sin groupId adopta la regla estable única del mismo nombre', () => {
  const product = { ...item([{ ...rule(1, 2), groupId: 'stable' }]), options: [option('chocolate')] };
  const groups = productOptionGroups(product, null);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].groupId, 'stable');
  assert.deepEqual(selectionIssues(groups, [{ groupId: 'stable', optionId: 'chocolate', quantity: 1 }]), []);
});
