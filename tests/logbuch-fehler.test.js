// «Verbesserungs-Logbuch» L1b: the errors the app noted become entries of the kind «Fehler». Fictional errors only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { recordError, list } from '../src/lib/fehler/felog.js';
import { takeIntoLog } from '../src/lib/logbuch/fehler.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

describe('noted errors go into the log', () => {
  it('each error becomes an entry, the same one on the same page counts up, the note is empty afterwards', async () => {
    const db = createDb('fehler-log-1');
    await db.open();
    const store = memory();
    const t0 = Date.UTC(2026, 10, 21, 12, 0);
    recordError(new Error('Probe A'), { page: '#/me', now: t0, store });
    recordError(new Error('Probe B'), { page: '#/trips', now: t0 + 1000, store });
    expect(await takeIntoLog(db, () => takeFrom(store), 390)).toBe(2);
    expect(list(store)).toEqual([]);
    let rows = await db.logbuch.toArray();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.art === 'fehler' && r.source === 'auto' && r.device === 'phone' && r.count === 1)).toBe(true);
    expect(rows.map((r) => r.text).sort()).toEqual(['Probe A', 'Probe B']);

    recordError(new Error('Probe A'), { page: '#/me', now: t0 + 5 * 60_000, store });
    await takeIntoLog(db, () => takeFrom(store), 390);
    rows = await db.logbuch.toArray();
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.text === 'Probe A').count).toBe(2);
  });
  it('nothing noted: nothing happens', async () => {
    const db = createDb('fehler-log-2');
    await db.open();
    expect(await takeIntoLog(db, () => [], 1440)).toBe(0);
    expect(await db.logbuch.count()).toBe(0);
  });
  it('when the database fails, the errors are not lost', async () => {
    const store = memory();
    globalThis.localStorage = store;
    const broken = { logbuch: { where: () => { throw new Error('db kaputt'); } } };
    const got = [{ message: 'Probe C', page: '#/', at: Date.now(), version: '1' }];
    expect(await takeIntoLog(broken, () => got, 390)).toBe(0);
    expect(JSON.parse(store.getItem('pg.errors'))).toHaveLength(1);
    delete globalThis.localStorage;
  });
});

import { takeErrors } from '../src/lib/fehler/felog.js';
const takeFrom = (store) => takeErrors(store);
