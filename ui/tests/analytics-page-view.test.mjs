import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPageViewTracker } from '../src/lib/analytics-page-view.ts';

test('captura la primera vista al estar listo gtag, deduplica hidratación y registra navegación', () => {
  const track = createPageViewTracker();
  let count = 0;
  const send = () => count++;
  track('/', false, true, send);
  assert.equal(count, 0);
  track('/', true, true, send);
  track('/', true, true, send);
  assert.equal(count, 1);
  track('/menu', true, true, send);
  track('/', true, true, send);
  assert.equal(count, 3);
  track('/menu', true, false, send);
  assert.equal(count, 3);
  track('/menu', true, true, send);
  assert.equal(count, 4);
});
