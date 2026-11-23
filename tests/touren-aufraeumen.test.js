// «Touren-Liste aufräumen» (Noah 23.11.2026): examples out of the list, doubled trips suggested and joined
// (nothing deleted, everything back with «Wieder trennen»), short times. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { listTrips, hiddenExamples, findDoubles, extraCount, bestOf, joinWrites, splitWrites, joinedGroups, shortTimeS, isExample } from '../src/lib/touren/aufraeumen.js';
import { joinDoubles, splitDoubles } from '../src/lib/touren/aufraeumendb.js';

const trip = (id, o = {}) => ({ id, title: 'Testfahrt Nord 8.10.', startDate: '2026-10-08', days: 1, bikeId: 'b1', bike: 'Gravel A', status: 'done', entries: [], createdAt: `2026-10-08T0${id.length % 9}:00:00Z`, ...o });
const packed = (n, of = n) => Array.from({ length: of }, (_, i) => ({ itemId: `i${i}`, qty: 1, packed: i < n }));

describe('Beispiele', () => {
  const real = [trip('a'), trip('b', { title: 'Andere', startDate: '2026-10-09' })];
  const ex = [trip('ex-trip', { title: 'Jura-Runde (Beispiel)' }), trip('ex-past', { title: 'Seerunde (Beispiel)' })];
  it('stay out of the list as soon as there is a real trip', () => {
    expect(listTrips([...real, ...ex]).map((x) => x.id)).toEqual(['a', 'b']);
    expect(hiddenExamples([...real, ...ex])).toBe(2);
  });
  it('can be shown again', () => {
    expect(listTrips([...real, ...ex], { showExamples: true })).toHaveLength(4);
  });
  it('are all there is: they stay (a fresh start shows its examples)', () => {
    expect(listTrips(ex)).toHaveLength(2);
    expect(hiddenExamples(ex)).toBe(0);
    expect(isExample(ex[0])).toBe(true);
  });
  it('keep the rule that archived and test trips are out', () => {
    expect(listTrips([trip('c', { archivedAt: 'x' }), trip('d', { testTrip: true }), trip('e')]).map((x) => x.id)).toEqual(['e']);
  });
});

describe('Doppelte finden', () => {
  const five = ['aa1', 'aa22', 'aa333', 'aa4444', 'aa55555'].map((id, i) => trip(id, { entries: packed(i, 10), createdAt: `2026-10-08T0${i}:00:00Z` }));
  it('same name, day, length and bike make a group; nothing else does', () => {
    const other = [trip('x1', { startDate: '2026-10-09' }), trip('x2', { bikeId: 'b2', bike: 'Fully' }), trip('x3', { days: 2 }), trip('x4', { title: 'Etwas anderes' })];
    const g = findDoubles([...five, ...other], []);
    expect(g).toHaveLength(1);
    expect(g[0].members).toHaveLength(5);
    expect(extraCount(g)).toBe(4);
  });
  it('upper case and spaces do not matter', () => {
    const g = findDoubles([trip('p1'), trip('p22', { title: '  testfahrt  NORD 8.10. ' })], []);
    expect(g).toHaveLength(1);
  });
  it('a single trip, archived trips, test trips and examples never make a group', () => {
    expect(findDoubles([trip('s')], [])).toEqual([]);
    expect(findDoubles([trip('s1'), trip('s22', { archivedAt: 'x' })], [])).toEqual([]);
    expect(findDoubles([trip('t1', { testTrip: true }), trip('t22', { testTrip: true })], [])).toEqual([]);
    expect(findDoubles([trip('ex-trip'), trip('ex-past')], [])).toEqual([]);
  });
  it('suggests to keep the one with a Rückblick, then the most packed, then the oldest', () => {
    const d = [{ tripId: 'aa22', status: 'done' }];
    expect(findDoubles(five, d)[0].keep).toBe('aa22');
    expect(findDoubles(five, [])[0].keep).toBe('aa55555'); // 4 of 10 packed
    const same = [trip('o1', { createdAt: '2026-10-08T09:00:00Z' }), trip('o22', { createdAt: '2026-10-08T05:00:00Z' })];
    expect(findDoubles(same, [])[0].keep).toBe('o22');
    expect(bestOf([{ id: 'u', rated: false, packed: 0, entries: 3, createdAt: '' }, { id: 'v', rated: false, packed: 0, entries: 9, createdAt: '' }]).id).toBe('v');
  });
  it('a draft debrief does not count as a Rückblick', () => {
    expect(findDoubles(five, [{ tripId: 'aa1', status: 'draft' }])[0].keep).toBe('aa55555');
  });
});

describe('Zusammenlegen und wieder trennen (rein)', () => {
  const trips = [trip('k1'), trip('k22'), trip('k333')];
  const debriefs = [{ tripId: 'k1', status: 'done' }, { tripId: 'k22', status: 'done' }, { tripId: 'k333', status: 'draft' }];
  const rides = [{ id: 'r1', tripId: 'k22' }, { id: 'r2', tripId: 'k1' }];
  const group = findDoubles(trips, debriefs)[0];
  it('archives only the extras, never deletes, and moves their rides to the kept trip', () => {
    const w = joinWrites({ trips, debriefs, rides }, group, 'k1', 'NOW');
    expect(w.trips.map((x) => x.id).sort()).toEqual(['k22', 'k333']);
    expect(w.trips[0].changes).toMatchObject({ archivedAt: 'NOW', skipped: true, dupAt: 'NOW', dupOf: 'k1' });
    expect(w.debriefs.map((x) => x.tripId).sort()).toEqual(['k22', 'k333']);
    expect(w.debriefs.find((x) => x.tripId === 'k333').changes.dupBefore).toEqual({ status: 'draft' });
    expect(w.rides).toEqual([{ id: 'r1', changes: { tripId: 'k1', dupFrom: 'k22' } }]);
  });
  it('an already archived trip is left alone', () => {
    const w = joinWrites({ trips: [trip('k1'), trip('k22', { archivedAt: 'old' })], debriefs: [], rides: [] }, group, 'k1');
    expect(w.trips).toEqual([]);
  });
  it('lists what was joined and puts everything back as it was', () => {
    const w = joinWrites({ trips, debriefs, rides }, group, 'k1', 'NOW');
    const after = trips.map((x) => ({ ...x, ...(w.trips.find((y) => y.id === x.id)?.changes ?? {}) }));
    expect(joinedGroups(after)).toMatchObject([{ keepId: 'k1', ids: ['k22', 'k333'] }]);
    const back = splitWrites({ trips: after, debriefs: debriefs.map((d) => ({ ...d, ...(w.debriefs.find((y) => y.tripId === d.tripId)?.changes ?? {}) })), rides: [{ id: 'r1', tripId: 'k1', dupFrom: 'k22' }] }, ['k22', 'k333'], 'LATER');
    expect(back.trips[0].changes).toMatchObject({ archivedAt: null, skipped: false, dupAt: null, dupOf: null });
    expect(back.debriefs.find((x) => x.tripId === 'k333').changes.status).toBe('draft');
    expect(back.rides).toEqual([{ id: 'r1', changes: { tripId: 'k22', dupFrom: null } }]);
  });
});

describe('Zusammenlegen und wieder trennen (Datenbank)', () => {
  let db;
  beforeEach(async () => {
    db = new Dexie(`t-${Math.random()}`);
    db.version(1).stores({ trips: 'id', debriefs: 'tripId', rides: 'id' });
    await db.trips.bulkPut([trip('m1', { entries: packed(5, 6) }), trip('m22'), trip('m333'), trip('keepme', { title: 'Andere Tour', startDate: '2026-10-10' })]);
    await db.debriefs.bulkPut([{ tripId: 'm1', status: 'done', note: 'gut' }, { tripId: 'm22', status: 'done', note: 'anders' }]);
    await db.rides.bulkPut([{ id: 'r1', tripId: 'm22', km: 30 }]);
  });
  it('joins, keeps every record, and takes apart again to the exact old state', async () => {
    const before = { trips: await db.trips.toArray(), debriefs: await db.debriefs.toArray(), rides: await db.rides.toArray() };
    const g = findDoubles(before.trips, before.debriefs)[0];
    expect(g.keep).toBe('m1');
    const ids = await joinDoubles(db, [{ group: g, keepId: 'm1' }]);
    expect(ids.sort()).toEqual(['m22', 'm333']);
    expect(await db.trips.count()).toBe(4); // nothing deleted
    expect(await db.debriefs.count()).toBe(2);
    expect((await db.trips.get('m22')).archivedAt).toBeTruthy();
    expect((await db.debriefs.get('m22')).status).toBe('archived');
    expect((await db.debriefs.get('m22')).note).toBe('anders'); // the words stay
    expect((await db.rides.get('r1')).tripId).toBe('m1');
    expect(findDoubles(await db.trips.toArray(), await db.debriefs.toArray())).toEqual([]); // the list is clean now
    expect(await splitDoubles(db, ids)).toBe(2);
    // back as before; «not riding» comes back as false, as in «Testdaten aufräumen»
    const strip = (rows) => rows.map((x) => Object.fromEntries(Object.entries(x).filter(([k, v]) => v != null && v !== false && k !== 'updatedAt'))).sort((a, b) => String(a.id ?? a.tripId).localeCompare(String(b.id ?? b.tripId)));
    expect(strip(await db.trips.toArray())).toEqual(strip(before.trips));
    expect(strip(await db.debriefs.toArray())).toEqual(strip(before.debriefs));
    expect((await db.rides.get('r1')).tripId).toBe('m22');
  });
  it('can keep another one than the suggestion', async () => {
    const g = findDoubles(await db.trips.toArray(), await db.debriefs.toArray())[0];
    await joinDoubles(db, [{ group: g, keepId: 'm333' }]);
    expect((await db.trips.get('m333')).archivedAt).toBeUndefined();
    expect((await db.trips.get('m1')).archivedAt).toBeTruthy();
  });
});

describe('Kurze Zeiten', () => {
  it('writes hours and minutes, never dd:hh:mm:ss', () => {
    expect(shortTimeS(9 * 3600 + 58 * 60 + 34)).toBe('9 h 58 min');
    expect(shortTimeS(15 * 60 + 5)).toBe('15 min');
    expect(shortTimeS(4800)).toBe('1 h 20 min');
    expect(shortTimeS(3 * 3600)).toBe('3 h');
    expect(shortTimeS(45)).toBe('45 s');
    expect(shortTimeS(26 * 3600 + 15 * 60)).toBe('1 d 2 h');
  });
  it('leaves out what is not there', () => {
    for (const v of [null, undefined, 0, -3, NaN, '']) expect(shortTimeS(v)).toBe('');
  });
});
