// Strava rides that two devices fetched before they compared: one key per Strava ride, and the doubles of before can be found and taken out. Fictional data.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { planSync, stravaEntryId, stravaDoubles } from '../src/lib/stravasync.js';
import { makeEntry } from '../src/lib/kmbook.js';
import { removeDoubles, syncBikes } from '../src/lib/kmbookdb.js';

const bikes = [{ id: 'b1', name: 'Gravel Blau' }];
const act = (over = {}) => ({ id: '501', name: 'Runde', type: 'GravelRide', start: '2026-11-15T09:00:00Z', km: 14.6, gearId: 'b1', device: 'Garmin Edge 540', trainer: false, ...over });
const gear = [{ id: 'b1', name: 'Gravel Blau' }];
const rules = [];
const sync = (entries) => planSync({ activities: [act()], gear, bikes, rules, entries, noBike: 'auto' }, new Date('2026-11-17T17:24:00Z'));

describe('one key per Strava ride', () => {
  it('two devices that fetch the same ride before they compare make the same key', () => {
    const a = sync([]).entries;
    const b = sync([]).entries;
    expect(a).toHaveLength(1);
    expect(a[0].id).toBe(stravaEntryId('501'));
    expect(b[0].id).toBe(a[0].id);
  });

  it('a device that already has the ride writes nothing new', () => {
    const have = sync([]).entries;
    expect(sync(have).entries).toHaveLength(0);
  });
});

describe('stravaDoubles', () => {
  const row = (id, over = {}) => makeEntry({ id, date: '2026-11-15', km: 14.6, kind: 'ride', source: 'strava', stravaId: '501', bikeId: 'b1', state: 'counted', ...over });

  it('finds a ride that is counted twice, keeps the one with most data, and does not touch the rest', () => {
    const list = [row('km-a', {}), row('km-b', { hrAvg: 130, hm: 120 }), row('km-c', { stravaId: '502', km: 6.7 }), row('km-d', { state: 'removed' })];
    const found = stravaDoubles(list);
    expect(found).toHaveLength(1);
    expect(found[0].keep.id).toBe('km-b');
    expect(found[0].drop.map((e) => e.id)).toEqual(['km-a']);
  });

  it('finds nothing when every Strava ride stands once, or the twin is already out of the count', () => {
    expect(stravaDoubles([row('km-a'), row('km-d', { state: 'removed' })])).toEqual([]);
  });
});

describe('removeDoubles', () => {
  it('takes the extra entry out of the count, the km follow, and Undo brings it back', async () => {
    const db = new Dexie('doppel-test');
    db.version(1).stores({ kmBook: 'id, bikeId, date, state, importId', bikes: 'id' });
    await db.bikes.put({ id: 'b1', km: 0 });
    const a = makeEntry({ id: 'km-a', date: '2026-11-15', km: 14.6, kind: 'ride', source: 'strava', stravaId: '501', bikeId: 'b1', state: 'counted' });
    const b = makeEntry({ id: 'km-b', date: '2026-11-15', km: 14.6, kind: 'ride', source: 'strava', stravaId: '501', bikeId: 'b1', state: 'counted', hrAvg: 130 });
    await db.kmBook.bulkPut([a, b]);
    await syncBikes(db, ['b1']);
    const before = (await db.bikes.get('b1')).km;
    const found = stravaDoubles(await db.kmBook.toArray());
    const undo = await removeDoubles(db, found);
    expect((await db.kmBook.get('km-a')).state).toBe('removed');
    expect((await db.kmBook.get('km-b')).state).toBe('counted');
    expect(before).toBe(29); // 29.2 km twice
    expect((await db.bikes.get('b1')).km).toBe(15); // 14.6 km once
    expect(undo.put.map((e) => e.id)).toEqual(['km-a']);
    db.close();
  });
});
