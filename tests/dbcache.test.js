// Tempo (Noah 11.11.2026, Messung 10.11.): the app's database does not deep-copy every liveQuery result (Dexie 4 default
// «cloned» made 1'440 rides cost 30 s at the start). Guard: the option stays, and liveQuery still follows changes.
import { describe, it, expect, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { liveQuery } from 'dexie';
import { createDb } from '../src/lib/db.js';

const names = [];
const fresh = async () => {
  const db = createDb(`test_data_gtp_cache_${Math.random()}`);
  names.push(db);
  await db.open();
  return db;
};
afterEach(() => names.splice(0).forEach((d) => d.close()));

describe('database copy mode', () => {
  it('is «disabled» (no deep copy of liveQuery results)', async () => {
    const db = await fresh();
    expect(db._options.cache).toBe('disabled');
  });

  it('liveQuery still reports every change, and changing a result does not change the next one', async () => {
    const db = await fresh();
    await db.settings.put({ key: 'a', value: { n: 1 } });
    const seen = [];
    const sub = liveQuery(() => db.settings.toArray()).subscribe((rows) => {
      seen.push(rows.map((r) => r.value.n));
      rows[0].value.n = 99; // a page that changes what it got must not touch the stored copy
    });
    await expect.poll(() => seen.length).toBe(1);
    await db.settings.put({ key: 'b', value: { n: 2 } });
    await expect.poll(() => seen.length).toBe(2);
    sub.unsubscribe();
    expect(seen).toEqual([[1], [1, 2]]);
  });
});
