import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({ resolve(specifier, context, nextResolve) {
  if (['./featured', './storefront-context', './restaurant-categories'].includes(specifier)) {
    return { url: new URL(`../src/lib/${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { sortDirectoryEntries } = await import('../src/lib/featured.ts');
const { filterIndexLocally } = await import('../src/lib/storefront-search.ts');
const { directoryMapsUrl } = await import('../src/lib/directory-location.ts');
const entry = (slug, overrides = {}) => ({ slug, name: slug, city: 'Colón', citySlug: 'colon',
  countrySlug: 'argentina', regionSlug: 'entre-rios', category: 'cafe', description: '', featured: [], ...overrides });
const featured = [{ citySlug: 'colon', scope: 'home', category: null }];

test('menús propios primero; destacados dentro de cada grupo sin mutar el índice', () => {
  const inventory = entry('a-inventario', { claimed: false, featured });
  const own = entry('b-menu'); // API vieja: claimed ausente sigue siendo propio.
  const ownFeatured = entry('c-menu-destacado', { claimed: true, featured });
  const other = entry('d-inventario', { claimed: false });
  const input = [inventory, own, ownFeatured, other];
  assert.deepEqual(sortDirectoryEntries(input, { citySlug: 'colon' }).map(e => e.slug),
    ['c-menu-destacado', 'b-menu', 'a-inventario', 'd-inventario']);
  assert.deepEqual(input, [inventory, own, ownFeatured, other]);
});

test('el fallback respeta provincia y prioridad de usuarios', () => {
  const data = [entry('café-importado', { claimed: false }), entry('café-propio'),
    entry('café-otra-provincia', { regionSlug: 'buenos-aires' })];
  const result = filterIndexLocally(data, { q: 'café', city: 'colon', region: 'entre-rios', country: 'argentina' });
  assert.deepEqual(result.results.map(e => e.slug), ['café-propio', 'café-importado']);
});

test('un destacado de otro rubro no gana prioridad fuera de su contexto', () => {
  const data = [entry('relevante'), entry('destacado-otro-rubro', {
    featured: [{ citySlug: 'colon', scope: 'category', category: 'pizzeria' }],
  })];
  assert.deepEqual(sortDirectoryEntries(data, { citySlug: 'colon', category: 'cafe' }), data);
});

test('Maps utiliza coordenadas comprobadas o dirección con ciudad y provincia', () => {
  const local = { name: 'Café', address: 'San Martín 123', city: 'Concepción del Uruguay', region: 'Entre Ríos', countrySlug: 'argentina' };
  assert.match(new URL(directoryMapsUrl(local)).searchParams.get('query'), /San Martín 123, Concepción del Uruguay, Entre Ríos/);
  assert.equal(new URL(directoryMapsUrl({ ...local, lat: -32.48, lng: -58.23 })).searchParams.get('query'), '-32.48,-58.23');
  assert.equal(directoryMapsUrl({ name: 'Sin ubicación', lat: NaN, lng: NaN }), null);
});
