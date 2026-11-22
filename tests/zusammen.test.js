// «Zusammenführen» (Noah 21.11.2026 «Ja, bauen», S8): two sports become one, with a full Undo. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { mergeActs, undoMerge, mergeCounts, foldSettings } from '../src/lib/flow/zusammen.js';
import { TICKS_KEY } from '../src/lib/stravaticks.js';
import { USUAL_KEY } from '../src/lib/flow/usualmin.js';
import { BLOCKS_KEY } from '../src/lib/flow/bloecke.js';

async function seed(name) {
  const db = createDb(name);
  await db.flowActs.bulkPut([
    { id: 'gym', name: 'Gym', order: 0, goals: [{ n: 2, days: 7 }] },
    { id: 'egym', name: 'eGym', order: 1 },
    { id: 'yoga', name: 'Yoga', order: 2 },
  ]);
  await db.flowLog.bulkPut([
    { id: 'l1', actId: 'gym', day: '2026-11-10', at: '2026-11-10T07:00:00.000Z', n: 1 },
    { id: 'l2', actId: 'egym', day: '2026-11-11', at: '2026-11-11T07:00:00.000Z', n: 1, min: 20 },
    { id: 'l3', actId: 'egym', day: '2026-11-12', at: '2026-11-12T07:00:00.000Z', n: 1 },
    { id: 'l4', actId: 'yoga', day: '2026-11-12', at: '2026-11-12T08:00:00.000Z', n: 1 },
  ]);
  await db.flowSessions.put({ id: 'l2', actId: 'egym', day: '2026-11-11', min: 20, marks: [] });
  await db.flowTemplates.put({ id: 't1', actId: 'egym', name: 'Kurz', usedAt: null });
  await db.settings.put({ key: TICKS_KEY, value: { mode: 'auto', map: { WeightTraining: 'egym', Yoga: 'yoga' } } });
  await db.settings.put({ key: USUAL_KEY, value: { egym: 20, yoga: 75 } });
  await db.settings.put({ key: BLOCKS_KEY, value: { egym: { size: 5, last: 2 } } });
  return db;
}

describe('merging two sports', () => {
  it('counts what moves before it asks', async () => {
    const db = await seed('zus-1');
    expect(await mergeCounts(db, 'egym')).toEqual({ log: 2, sessions: 1, templates: 1, strava: 1 });
    expect(await mergeCounts(db, 'gym')).toEqual({ log: 1, sessions: 0, templates: 0, strava: 0 });
  });

  it('moves ticks, details, templates and the Strava sport; the first sport leaves; the target keeps its goals', async () => {
    const db = await seed('zus-2');
    const saved = await mergeActs(db, 'egym', 'gym');
    expect(saved.fromId).toBe('egym');
    expect(await db.flowActs.get('egym')).toBeUndefined();
    expect((await db.flowActs.get('gym')).goals).toEqual([{ n: 2, days: 7 }]);
    expect((await db.flowLog.where('actId').equals('gym').toArray()).map((e) => e.id).sort()).toEqual(['l1', 'l2', 'l3']);
    expect(await db.flowLog.where('actId').equals('egym').count()).toBe(0);
    expect((await db.flowLog.get('l2')).min).toBe(20);
    expect((await db.flowSessions.get('l2')).actId).toBe('gym');
    expect((await db.flowTemplates.get('t1')).actId).toBe('gym');
    expect((await db.settings.get(TICKS_KEY)).value.map).toEqual({ WeightTraining: 'gym', Yoga: 'yoga' });
    // the target had no duration or block of its own: they come over
    expect((await db.settings.get(USUAL_KEY)).value).toEqual({ gym: 20, yoga: 75 });
    expect((await db.settings.get(BLOCKS_KEY)).value).toEqual({ gym: { size: 5, last: 2 } });
    // other sports are untouched
    expect((await db.flowLog.get('l4')).actId).toBe('yoga');
  });

  it('an own value of the target wins over the first sport', () => {
    const r = foldSettings('egym', 'gym', { usual: { egym: 20, gym: 45 }, blocks: { egym: { size: 5 }, gym: { size: 12 } } });
    expect(r.usual).toEqual({ gym: 45 });
    expect(r.blocks).toEqual({ gym: { size: 12 } });
  });

  it('Undo puts every row, the sport and the settings back exactly', async () => {
    const db = await seed('zus-3');
    const before = {
      acts: await db.flowActs.toArray(),
      log: await db.flowLog.toArray(),
      sessions: await db.flowSessions.toArray(),
      templates: await db.flowTemplates.toArray(),
      settings: await db.settings.toArray(),
    };
    const saved = await mergeActs(db, 'egym', 'gym');
    await undoMerge(db, saved);
    const sort = (l) => [...l].sort((a, b) => String(a.id ?? a.key).localeCompare(String(b.id ?? b.key)));
    expect(sort(await db.flowActs.toArray())).toEqual(sort(before.acts));
    expect(sort(await db.flowLog.toArray())).toEqual(sort(before.log));
    expect(sort(await db.flowSessions.toArray())).toEqual(sort(before.sessions));
    expect(sort(await db.flowTemplates.toArray())).toEqual(sort(before.templates));
    expect(sort(await db.settings.toArray())).toEqual(sort(before.settings));
  });

  it('does nothing for the same sport or a sport that is not there', async () => {
    const db = await seed('zus-4');
    expect(await mergeActs(db, 'gym', 'gym')).toBeNull();
    expect(await mergeActs(db, 'nope', 'gym')).toBeNull();
    expect(await mergeActs(db, 'gym', 'nope')).toBeNull();
    expect(await db.flowActs.count()).toBe(3);
  });

  it('never touches the other sports, and a merge works without any setting', async () => {
    const db = createDb('zus-5');
    await db.flowActs.bulkPut([{ id: 'a', name: 'A', order: 0 }, { id: 'b', name: 'B', order: 1 }]);
    await db.flowLog.put({ id: 'x', actId: 'a', day: '2026-11-01', at: '2026-11-01T07:00:00.000Z', n: 1 });
    const saved = await mergeActs(db, 'a', 'b');
    expect((await db.flowLog.get('x')).actId).toBe('b');
    expect(await db.settings.count()).toBe(0);
    await undoMerge(db, saved);
    expect((await db.flowLog.get('x')).actId).toBe('a');
    expect(await db.settings.count()).toBe(0);
  });

  it('the result goes through the backup and comes back (check with a copy, Noah rule 3)', async () => {
    const { buildBackup, restoreBackup, validateBackup } = await import('../src/lib/backup.js');
    const a = await seed('zus-backup-a');
    await mergeActs(a, 'egym', 'gym');
    const copy = JSON.parse(JSON.stringify(await buildBackup(a)));
    expect(validateBackup(copy)).toEqual([]);
    const b = createDb('zus-backup-b');
    await restoreBackup(b, copy, 'replace');
    expect(await b.flowActs.get('egym')).toBeUndefined();
    expect((await b.flowLog.where('actId').equals('gym').toArray()).length).toBe(3);
    expect((await b.settings.get(TICKS_KEY)).value.map.WeightTraining).toBe('gym');
  });
});
