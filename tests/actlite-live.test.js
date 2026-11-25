// «Aktivitäten-Zusammenfassung»: a liveQuery that reads the small table is told about every change of `activities` (a save of one field shows at once).
import 'fake-indexeddb/auto';
import { liveQuery } from 'dexie';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { readLite, buildLite, startLite, liteAll } from '../src/lib/actlite.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
describe('liveQuery over the small table', () => {
  it('runs again after an update of one field of activities', async () => {
    const db = createDb(`live-${Math.random()}`);
    await db.open();
    await db.activities.bulkPut([{ id: '1', day: '2026-11-01', kind: 'run', km: 5 }]);
    await buildLite(db, { breath: async () => {} });
    const seen = [];
    const sub = liveQuery(() => readLite(db, (T) => T.where('day').aboveOrEqual('2026-10-01').toArray())).subscribe({ next: (v) => seen.push(v.map((r) => r.feelSkip ?? null)) });
    await wait(100);
    await db.activities.update('1', { feelSkip: true });
    await wait(200);
    sub.unsubscribe();
    expect(seen.at(-1)).toEqual([true]);
  });
  it('also when the check of the summary started outside of the query and is still running (the app start)', async () => {
    const db = createDb(`live-${Math.random()}`);
    await db.open();
    await db.activities.bulkPut([{ id: '1', day: '2026-11-01', kind: 'run', km: 5 }]);
    const started = startLite(db, { delay: 1e9 }); // not awaited: the query meets it unfinished
    const seen = [];
    const sub = liveQuery(() => readLite(db, (T) => T.where('day').aboveOrEqual('2026-10-01').toArray())).subscribe({ next: (v) => seen.push(v.map((r) => r.feelSkip ?? null)) });
    await started;
    await wait(100);
    await db.activities.update('1', { feelSkip: true });
    await wait(200);
    sub.unsubscribe();
    expect(seen.at(-1)).toEqual([true]);
  });

  it('liteAll: one read for several askers, an own array each, and a save ends the sharing', async () => {
    const db = createDb(`live-${Math.random()}`);
    await db.open();
    await db.activities.bulkPut([
      { id: '1', day: '2026-11-01', kind: 'run', km: 5 },
      { id: '2', day: '2026-11-02', kind: 'bike', km: 40 },
    ]);
    await buildLite(db, { breath: async () => {} });
    await startLite(db, { delay: 1e9 });
    let reads = 0;
    const orig = db.activitiesLite.toArray.bind(db.activitiesLite);
    db.activitiesLite.toArray = (...a) => (reads++, orig(...a));
    const [a, b] = await Promise.all([liteAll(db), liteAll(db)]);
    expect(reads).toBe(1);
    expect(a.map((r) => r.id).sort()).toEqual(['1', '2']);
    a.reverse();
    expect(b.map((r) => r.id).sort()).toEqual(['1', '2']);
    await db.activities.update('1', { feelSkip: true });
    const c = await liteAll(db);
    expect(reads).toBe(2); // the save ended the sharing
    expect(c.find((r) => r.id === '1').feelSkip).toBe(true);
  });
  it('liteAll inside a liveQuery: runs again after a change', async () => {
    const db = createDb(`live-${Math.random()}`);
    await db.open();
    await db.activities.bulkPut([{ id: '1', day: '2026-11-01', kind: 'run', km: 5 }]);
    await buildLite(db, { breath: async () => {} });
    await startLite(db, { delay: 1e9 });
    await liteAll(db); // the shared read is warm before the query starts: the query gets rows without reading them itself
    const seen = [];
    const sub = liveQuery(async () => (await liteAll(db)).map((r) => r.feelSkip ?? null)).subscribe({ next: (v) => seen.push(v) });
    await wait(100);
    await db.activities.update('1', { feelSkip: true });
    await wait(250);
    sub.unsubscribe();
    expect(seen.at(-1)).toEqual([true]);
  });
});
