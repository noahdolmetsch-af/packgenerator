// Paket H (Noah 19.10.2026 «1a aber nutzer kann alle daten jederzeit reseten …»):
// 1. #47 «Velo-Daten geschützt»: the steps that run on every start and after every import (tidyData)
//    never change a value already set on a bike; they only fill in what is missing.
// 2. «Neu beginnen»: all data goes, a copy stays (kind 'reset'), «Undo» brings it back; device settings stay.
// Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, DATA_TABLES } from '../src/lib/db.js';
import { createSnapDb, resetAll, undoReset, listSnapshots, KEEP } from '../src/lib/maintenance/snapshots.js';
import { completeBike } from '../src/lib/bikes.js';
import { tidyData } from '../src/lib/tidy.js';

let n = 0;
let db;
let sdb;
beforeEach(() => {
  n += 1;
  db = createDb(`h-daten-${n}`);
  sdb = createSnapDb(`h-daten-snap-${n}`);
});

const bike = {
  id: 'test_data_gtp_bike', name: 'test_data_gtp_ Gravel', type: 'Gravel', use: 'Bikepacking', weightG: 9400,
  slots: ['seat', 'frame', 'top'], setup: { seat: 'test_data_gtp_bag1' }, km: 1234, kmDate: '2026-10-01',
  fit: { seatHeight: 742, reach: 410 }, gearing: ['1x12'], openPoints: 'test_data_gtp_ Kette prüfen', photo: null,
};

describe('#47 bike data stays as it is', () => {
  it('completeBike keeps every value that is set', () => {
    const out = completeBike(bike, [{ id: 'test_data_gtp_bag1' }]);
    for (const [k, v] of Object.entries(bike)) expect(out[k], k).toEqual(v);
  });
  it('the start and import steps (tidyData) change no value the bike already has', async () => {
    await db.bikes.put(structuredClone(bike));
    await tidyData(db);
    await tidyData(db);
    const after = await db.bikes.get(bike.id);
    for (const [k, v] of Object.entries(bike)) {
      if (k === 'km' || k === 'kmDate') continue; // the km counter becomes the ride ledger's opening entry, same number
      expect(after[k], k).toEqual(v);
    }
    expect(after.km ?? bike.km).toBe(bike.km);
  });
});

describe('«Start fresh»', () => {
  it('empties every data table, keeps a copy and the device settings; Undo brings all back', async () => {
    await db.bikes.put(structuredClone(bike));
    await db.items.put({ id: 'test_data_gtp_i1', name: 'test_data_gtp_ Riegel', category: 'food', qty: 1, ownership: 'owned', domains: ['bikepacking'] });
    await db.settings.bulkPut([{ key: 'tips', value: { off: true } }, { key: 'lends', value: [] }]);
    const id = await resetAll(db, sdb, { current: '0.149.0' });
    for (const name of DATA_TABLES) {
      const rows = await db.table(name).toArray();
      if (name === 'settings') expect(rows.map((r) => r.key)).toEqual(['tips']);
      else expect(rows.length, name).toBe(0);
    }
    const list = await listSnapshots(sdb);
    expect(list[0]).toMatchObject({ id, kind: 'reset' });
    expect(KEEP.reset).toBe(1);
    await undoReset(db, sdb, id);
    expect((await db.bikes.get(bike.id)).name).toBe(bike.name);
    expect(await db.items.count()).toBe(1);
    expect((await db.settings.get('lends'))?.value).toEqual([]);
  });
});

// #260 «Regel-Editor» (Noah 19.10.2026 «3a»): an own block with its own rule
import { ownRuleOf, ownHit, ownHits, setOwnRule, tripFacts } from '../src/lib/situation.js';
import { blockRows } from '../src/lib/packblocks.js';
import { allSets } from '../src/lib/sets.js';
import { hitBadge } from '../src/lib/situationtext.js';

describe('#260 own rules', () => {
  const sets = [{ key: 'u-dunkel', name: 'test_data_gtp_ Dunkel', rule: { on: true, metric: 'hours', cmp: 'gt', limit: 6 } }, { key: 'u-zug', name: 'test_data_gtp_ Zug', rule: { on: true, metric: 'train' } }, { key: 'u-ohne', name: 'test_data_gtp_ Ohne' }];
  const items = [
    { id: 'a', name: 'test_data_gtp_ Lampe', category: 'light', weightG: 90, ownership: 'owned', sets: ['u-dunkel'] },
    { id: 'b', name: 'test_data_gtp_ Ticket', category: 'tools', weightG: 5, ownership: 'owned', sets: ['u-zug'] },
    { id: 'c', name: 'test_data_gtp_ X', category: 'tools', weightG: 5, ownership: 'owned', sets: ['u-ohne'] },
  ];
  const trip = (extra = {}) => ({ id: 't', overnight: 'none', sets: {}, entries: [], days: 1, ...extra });
  it('checks every field; a broken rule falls back, no rule is null', () => {
    expect(ownRuleOf(null)).toBeNull();
    expect(ownRuleOf({ metric: 'nope', cmp: 'x', limit: 'a' })).toEqual({ on: true, metric: 'minC', cmp: 'gte', limit: 0 });
    expect(ownRuleOf({ on: false, metric: 'abroad', limit: 3 })).toEqual({ on: false, metric: 'abroad' });
  });
  it('a fitting own rule is a suggestion in Packen with its reason; switched off or no rule: nothing', () => {
    const hits = ownHits(trip({ hours: 7, arrival: 'train' }), sets);
    expect(hits['u-dunkel']).toEqual({ kind: 'own', metric: 'hours', value: 7, own: true });
    expect(hits['u-zug']).toEqual({ kind: 'train', own: true });
    expect(hits['u-ohne']).toBeUndefined();
    expect(ownHits(trip({ hours: 5 }), sets)['u-dunkel']).toBeUndefined();
    expect(ownHit({ on: false, metric: 'train' }, tripFacts(trip({ arrival: 'train' })))).toBeNull();
    const rows = blockRows(trip({ hours: 7, arrival: 'train' }), items, sets);
    const dunkel = rows.add.find((r) => r.key === 'u-dunkel');
    expect(dunkel.suggest).toMatchObject({ kind: 'own', metric: 'hours' });
    expect(dunkel.rule).toMatchObject({ metric: 'hours', limit: 6 });
    expect(rows.add[0].suggest).toBeTruthy(); // suggestions first
    expect(rows.add.find((r) => r.key === 'u-ohne').suggest).toBeNull();
    expect(hitBadge(dunkel.suggest)).toBeTruthy();
  });
  it('the rule is saved on the own record and kept by allSets; null takes it away', () => {
    const v = setOwnRule(sets, 'u-ohne', { on: true, metric: 'maxC', cmp: 'gt', limit: 30 });
    expect(v.find((s) => s.key === 'u-ohne')).toEqual({ key: 'u-ohne', name: 'test_data_gtp_ Ohne', rule: { on: true, metric: 'maxC', cmp: 'gt', limit: 30 } });
    expect(allSets(v).find((s) => s.key === 'u-ohne').rule).toEqual({ on: true, metric: 'maxC', cmp: 'gt', limit: 30 });
    expect(setOwnRule(v, 'u-ohne', null).find((s) => s.key === 'u-ohne')).toEqual({ key: 'u-ohne', name: 'test_data_gtp_ Ohne' });
  });
});
