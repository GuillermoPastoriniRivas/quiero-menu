import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeOptionRule, productOptionGroups, reconcileProductOptions, selectionIssues, toggleProductOption } from '../src/lib/menu-options.ts';

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
