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
