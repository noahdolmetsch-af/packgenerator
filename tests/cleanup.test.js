// Data cleanup 14.10.2026 (Noah 1a, 3a, thread «Daten einmal bereinigen»). Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { cleanupData, excelBikeChanges, withoutOldFields, CLEANUP_BACKUP, WEIGHT_NOTE_ID } from '../src/lib/cleanup.js';
import { sortBikes } from '../src/lib/bikes.js';
import { guessBike } from '../src/lib/notes.js';
import { taskBike } from '../src/lib/care.js';
import { comesOf } from '../src/lib/gear/comes.js';

let n = 0;
const fresh = () => createDb(`cleanup-${++n}`);

describe('data cleanup', () => {
  it('an empty database stays empty and keeps no copy', async () => {
    const db = fresh();
    expect(await cleanupData(db)).toEqual({ bikes: 0, tasks: 0, items: 0, kits: 0, weightChecks: 0 });
    expect(await db.table('meta').get(CLEANUP_BACKUP)).toBeUndefined();
  });

  it('the first Excel bikes get their order and extra names, their repairs get the bike; other data nothing', async () => {
    const bikes = [
      { id: 'test_data_gtp_bike', name: 'test_data_gtp_ Bike' },
      { id: 'canyon-world-cup', name: 'test_data_gtp_ C' },
      { id: 'scott-hardtail', name: 'test_data_gtp_ S' },
    ];
    const tasks = [
      { id: 1, subject: 'Hardtail', task: 'test_data_gtp_ shifting' },
      { id: 2, subject: 'Factor', task: 'test_data_gtp_ no such bike here' },
      { id: 3, subject: 'Hardtail', bikeId: 'test_data_gtp_bike', task: 'test_data_gtp_ own bike stays' },
      { id: 4, subject: 'test_data_gtp_ shoes', task: 'test_data_gtp_ not a bike' },
    ];
    const ch = excelBikeChanges(bikes, tasks);
    expect(ch.bikes).toEqual([
      ['scott-hardtail', { order: 1, aliases: ['hardtail', 'scale'] }],
      ['canyon-world-cup', { order: 4, aliases: ['canyon', 'lux'] }],
    ]);
    expect(ch.tasks).toEqual([[1, { bikeId: 'scott-hardtail' }]]);
    // a value already set stays
    expect(excelBikeChanges([{ id: 'fully', order: 7, aliases: [] }], [])).toEqual({ bikes: [], tasks: [] });
  });

  it('writes it once, keeps a copy first, and the screens read the data: order, note words, repairs', async () => {
    const db = fresh();
    await db.bikes.bulkPut([
      { id: 'test_data_gtp_bike', name: 'test_data_gtp_ Aaa' },
      { id: 'canyon-world-cup', name: 'test_data_gtp_ Ccc' },
      { id: 'fully', name: 'test_data_gtp_ Fff' },
    ]);
    await db.maintenance.put({ id: 1, subject: 'Full suspension', task: 'test_data_gtp_ fork', status: 'open' });
    const res = await cleanupData(db);
    expect(res).toMatchObject({ bikes: 2, tasks: 1 });
    const copy = await db.table('meta').get(CLEANUP_BACKUP);
    expect(copy.backup.tables.bikes.every((b) => b.order == null)).toBe(true); // the copy is from before
    const bikes = await db.bikes.toArray();
    expect(sortBikes(bikes).map((b) => b.id)).toEqual(['fully', 'canyon-world-cup', 'test_data_gtp_bike']);
    expect(guessBike('the Spark creaks', bikes)).toBe('fully');
    expect(guessBike('lux tyre', bikes)).toBe('canyon-world-cup');
    expect(taskBike(await db.maintenance.get(1))).toBe('fully');
    expect(await cleanupData(db)).toEqual({ bikes: 0, tasks: 0, items: 0, kits: 0, weightChecks: 0 });
  });

  it('old kits and weight checks: the kits table and item.kits are emptied, the checks become one kept note', async () => {
    const db = fresh();
    await db.kits.put({ id: 'D', name: 'test_data_gtp_ Daily', domain: 'bikepacking' });
    await db.items.put({ id: 'test_data_gtp_A', name: 'test_data_gtp_ A', ownership: 'owned', sets: [], kits: ['D'] });
    await db.weightChecks.bulkPut([
      { id: 1, item: 'test_data_gtp_ Lamp', logbook: '120 g', online: '110 g', adoptedG: 115, decision: 'Confirmed', sources: 'test_data_gtp_ shop', link: '' },
      { id: 2, item: 'test_data_gtp_ Mat', adoptedG: null, decision: '', online: '', sources: '', link: '' },
    ]);
    const res = await cleanupData(db);
    expect(res).toMatchObject({ kits: 1, weightChecks: 2, items: 1 });
    expect(await db.kits.count()).toBe(0);
    expect(await db.weightChecks.count()).toBe(0);
    expect('kits' in (await db.items.get('test_data_gtp_A'))).toBe(false);
    const note = await db.notes.get(WEIGHT_NOTE_ID);
    expect(note).toMatchObject({ status: 'kept', kind: 'note', topic: 'gear' });
    expect(note.text.split('\n')).toEqual(['- test_data_gtp_ Lamp · 115 g · Confirmed · 110 g · Logbook: 120 g · test_data_gtp_ shop', '- test_data_gtp_ Mat']);
    // an older backup brings the same checks again: no line twice
    await db.weightChecks.put({ id: 1, item: 'test_data_gtp_ Lamp', logbook: '120 g', online: '110 g', adoptedG: 115, decision: 'Confirmed', sources: 'test_data_gtp_ shop', link: '' });
    await cleanupData(db);
    expect((await db.notes.get(WEIGHT_NOTE_ID)).text.split('\n')).toHaveLength(2);
  });

  it('old block fields go and every item says the same as before', () => {
    const base = { id: 'X', name: 'test_data_gtp_ X', ownership: 'owned', sets: [] };
    const cases = [
      { role: 'standard' },
      { always: true },
      { always: false },
      { role: 'optional' },
      { role: 'optional', leaveHome: false },
      { role: 'worn', always: true },
      { role: 'standard', leaveHome: true },
      { sets: ['standard', 'light', 'lights'], split2026: true },
      { lightSetDone: true, sets: ['light'] },
    ];
    for (const f of cases) {
      const item = { ...base, ...f };
      const out = withoutOldFields(item);
      expect(comesOf(out)).toEqual(comesOf(item));
      expect(['standard', 'optional']).not.toContain(out.role);
      for (const k of ['always', 'kits', 'lightSetDone', 'split2026']) expect(k in out).toBe(false);
    }
    // old keys only go once blocksplit.js mapped them
    expect(withoutOldFields({ ...base, sets: ['standard', 'lights'], split2026: true }).sets).toEqual(['standard', 'lights']);
    expect(withoutOldFields({ ...base, sets: ['light', 'lights'], split2026: true }).sets).toEqual(['lights']);
    expect(withoutOldFields({ ...base, sets: ['base'] })).toBeNull();
    expect(withoutOldFields({ ...base, role: 'worn', sets: ['standard'] })).toBeNull();
  });
});
