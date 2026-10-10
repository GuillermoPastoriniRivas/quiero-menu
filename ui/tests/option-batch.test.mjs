import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optionBatch, saveOptionBatch } from '../src/lib/option-batch.ts';

test('un reintento tras una respuesta perdida conserva la clave y no duplica lo ya guardado', async () => {
  let sequence = 0;
  const entries = optionBatch(' Chocolate\nFrutilla\nChocolate\nCrema ', [], () => `request-${++sequence}`);
  const persisted = new Map();
  let fail = true;
  const save = async (entry) => {
    persisted.set(entry.requestId, entry.name);
    if (entry.name === 'Frutilla' && fail) { fail = false; throw new Error('Se perdió la respuesta'); }
  };
  const first = await saveOptionBatch(entries, save, () => {});
  assert.equal(first.completed, 1);
  assert.deepEqual(first.pending.map((e) => e.name), ['Frutilla', 'Crema']);
  const retry = optionBatch(first.pending.map((e) => e.name).join('\n'), first.pending, () => `request-${++sequence}`);
  assert.equal(retry[0].requestId, entries[1].requestId);
  assert.equal((await saveOptionBatch(retry, save, () => {})).error, null);
  assert.equal(persisted.size, 3);
});
