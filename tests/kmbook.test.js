import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  bikeKm, kmOn, ledgerRows, ledgerCounts, makeEntry, openingEntry, syncEntry, readingEntry, ledgerStart, inStart,
  parseStravaCsv, stravaTime, zurichDay, parseFit, sameRide, mergeRides, signals, assignRide, planImport, importEntries,
  reconcile, matches, isoWeek, partStart, partKm, q1Status, monthReport, prevMonth, reasonText, tripSpan, tripRidesIn, sensorShort,
} from '../src/lib/kmbook.js';
import { createDb } from '../src/lib/db.js';
import { ensureKmBook, setReading, addEntries, updateEntry, applyImport, undoImport, deleteEntries, restoreEntries } from '../src/lib/kmbookdb.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { fitRide } from './fixtures/fit.js';

// v0.68.0 «Q1 Jeder km zählt»: the ride ledger. Fictional bikes only.
const BIKES = [
  { id: 'test_data_gtp_neu', name: 'Demo Neu' },
  { id: 'test_data_gtp_gravel', name: 'Demo Gravel' },
  { id: 'test_data_gtp_hardtail', name: 'Demo Hardtail' },
  { id: 'test_data_gtp_trail', name: 'Demo Trail' },
  { id: 'test_data_gtp_renn', name: 'Demo Rennvelo' },
];
const NEU = 'test_data_gtp_neu';
const GRAVEL = 'test_data_gtp_gravel';
const HT = 'test_data_gtp_hardtail';
const TRAIL = 'test_data_gtp_trail';
const at = new Date('2026-10-10T08:00:00Z');
const e = (f) => makeEntry({ bikeId: NEU, ...f }, at);

describe('the ledger: the km are the sum of the entries that count', () => {
  const entries = [
    e({ id: 'a', date: '2026-09-05', km: 0, kind: 'start' }),
    e({ id: 'b', date: '2026-09-06', km: 18.2, kind: 'ride' }),
    e({ id: 'c', date: '2026-09-12', km: 57, kind: 'ride' }),
    e({ id: 'd', date: '2026-09-27', km: -6, kind: 'correction', note: 'counted twice' }),
    e({ id: 'o', date: '2026-10-03', km: 14, kind: 'ride', state: 'open' }),
    e({ id: 'x', date: '2026-10-01', km: 99, kind: 'ride', state: 'removed' }),
    e({ id: 'g', bikeId: GRAVEL, date: '2026-10-01', km: 40, kind: 'ride' }),
  ];
  it('sums counted entries only, per bike; open and left-out rides do not count', () => {
    expect(bikeKm(entries, NEU)).toEqual({ km: 69, kmDate: '2026-09-27', exact: 69.2 });
    expect(bikeKm(entries, GRAVEL).km).toBe(40);
    expect(bikeKm(entries, 'nobody').km).toBeNull();
    expect(kmOn(entries, NEU, '2026-09-12')).toBe(75);
  });
  it('rows newest first with the km after each counted entry', () => {
    const rows = ledgerRows(entries, NEU);
    expect(rows.map((r) => r.id)).toEqual(['o', 'x', 'd', 'c', 'b', 'a']);
    expect(rows.map((r) => r.after)).toEqual([null, null, 69.2, 75.2, 18.2, 0]);
    const n = ledgerCounts(entries, NEU);
    expect([n.rides, n.corrections, n.open.length, n.removed]).toEqual([2, 1, 1, 1]);
  });
});

describe('migration: the old counter becomes the opening entry, idempotent, nothing lost', () => {
  it('a bike with km and no ledger gets one opening entry; a second run writes nothing', async () => {
    const db = createDb(`km-mig-${Math.random()}`);
    await db.bikes.bulkPut([{ id: GRAVEL, name: 'Demo Gravel', km: 12800, kmDate: '2026-10-04' }, { id: TRAIL, name: 'Demo Trail' }]);
    expect(await ensureKmBook(db, '2026-10-10')).toBe(true);
    const book = await db.kmBook.toArray();
    expect(book).toHaveLength(1);
    expect(book[0]).toMatchObject({ bikeId: GRAVEL, km: 12800, kind: 'start', date: '2026-10-04', inclusive: true, state: 'counted' });
    expect(await ensureKmBook(db, '2026-10-10')).toBe(false);
    expect(await db.kmBook.count()).toBe(1);
    expect((await db.bikes.get(GRAVEL)).km).toBe(12800);
    expect((await db.bikes.get(TRAIL)).km).toBeUndefined();
  });
  it('a counter changed outside the ledger (older app, older backup) gets a visible entry with the difference', async () => {
    const db = createDb(`km-sync-${Math.random()}`);
    await db.bikes.put({ id: GRAVEL, name: 'Demo Gravel', km: 12800, kmDate: '2026-10-04' });
    await ensureKmBook(db, '2026-10-10');
    await db.bikes.update(GRAVEL, { km: 12850, kmDate: '2026-10-08' });
    await ensureKmBook(db, '2026-10-10');
    const sync = (await db.kmBook.toArray()).find((x) => x.source === 'sync');
    expect(sync).toMatchObject({ km: 50, kind: 'reading', date: '2026-10-08' });
    expect((await db.bikes.get(GRAVEL)).km).toBe(12850);
  });
  it('pure: openingEntry and syncEntry', () => {
    expect(openingEntry({ id: NEU }, [])).toBeNull();
    expect(openingEntry({ id: NEU, km: 5 }, [e({ km: 1 })])).toBeNull();
    expect(syncEntry({ id: NEU, km: 10 }, [e({ km: 10 })])).toBeNull();
    expect(syncEntry({ id: NEU, km: 12 }, [e({ km: 10 })]).km).toBe(2);
  });
  it('a new reading writes the difference, never overwrites; the same km writes nothing', async () => {
    const db = createDb(`km-read-${Math.random()}`);
    await db.bikes.put({ id: NEU, name: 'Demo Neu' });
    await setReading(db, NEU, 100, { date: '2026-10-01' });
    await setReading(db, NEU, 130, { date: '2026-10-05' });
    expect(await setReading(db, NEU, 130, { date: '2026-10-06' })).toBeNull();
    const book = await db.kmBook.toArray();
    expect(book.map((x) => [x.kind, x.km]).sort()).toEqual([['reading', 30], ['start', 100]]);
    expect(await db.bikes.get(NEU)).toMatchObject({ km: 130, kmDate: '2026-10-05' });
    expect(readingEntry([], NEU, 5).kind).toBe('start');
  });
  it('the ledger goes into the backup and comes back; an old backup without it still imports', async () => {
    const db = createDb(`km-bak-${Math.random()}`);
    await db.bikes.put({ id: NEU, name: 'Demo Neu', km: 0, kmDate: '2026-09-05' });
    await ensureKmBook(db);
    await addEntries(db, [e({ date: '2026-09-06', km: 18 })]);
    const file = await buildBackup(db);
    expect(file.tables.kmBook).toHaveLength(2);
    const db2 = createDb(`km-bak2-${Math.random()}`);
    await restoreBackup(db2, file, 'replace');
    expect(await db2.kmBook.count()).toBe(2);
    const old = { app: 'pack-generator', schemaVersion: 6, tables: { bikes: [{ id: GRAVEL, name: 'Demo Gravel', km: 300, kmDate: '2026-10-01' }] } };
    await restoreBackup(db2, old, 'replace');
    expect(await db2.kmBook.count()).toBe(0);
    await ensureKmBook(db2);
    expect(await db2.kmBook.toArray()).toMatchObject([{ bikeId: GRAVEL, km: 300, kind: 'start' }]);
  });
});

describe('Strava CSV with the bike column «Activity Gear»', () => {
  const csv = [
    'Activity ID,Activity Date,Activity Name,Activity Type,Activity Description,Elapsed Time,Distance,Commute,Activity Gear,Filename,Distance',
    '901,"Oct 4, 2026, 7:12:33 AM",Rundfahrt Albis,Ride,"a description, with a comma",7200,41.20,false,Demo Neu,activities/901.fit.gz,41200.0',
    '902,"Oct 3, 2026, 4:40:00 PM",Feierabendrunde,Mountain Bike Ride,,3000,14.05,false,Demo Neu,,14050.0',
    '903,"Oct 3, 2026, 11:30:00 PM",Nachtfahrt,Gravel Ride,"line one',
    'line two",3000,"1,012.5",false,,,1012500',
    '904,"Oct 2, 2026, 6:00:00 AM",Morgenlauf,Run,,1800,8.0,false,,,8000',
    '905,"Oct 1, 2026, 6:00:00 AM",Zwift,Virtual Ride,,1800,20.0,false,,,20000',
  ].join('\n');
  it('reads date (UTC → Zurich day), km, name, type, gear and id; skips runs and virtual rides without a bike', () => {
    const { rides, other } = parseStravaCsv(csv);
    expect(other).toBe(2);
    expect(rides).toHaveLength(3);
    expect(rides[0]).toMatchObject({ date: '2026-10-04', km: 41.2, name: 'Rundfahrt Albis', type: 'Ride', gear: 'Demo Neu', stravaId: '901', time: '2026-10-04T07:12:33Z' });
    expect(rides[1]).toMatchObject({ date: '2026-10-03', km: 14.1, time: '2026-10-03T16:40:00Z' });
    // 23:30 UTC on 3 Oct is 01:30 on 4 Oct in Zurich; the line break inside the description is kept
    expect(rides[2]).toMatchObject({ date: '2026-10-04', km: 1012.5, gear: '' });
  });
  it('helpers: Strava time, Zurich day', () => {
    expect(stravaTime('Oct 4, 2026, 12:05:00 AM')).toBe('2026-10-04T00:05:00Z');
    expect(stravaTime('2026-10-04 07:00:00')).toBeNull();
    expect(zurichDay('2026-03-28T23:30:00Z')).toBe('2026-03-29'); // winter time: +1 h
    expect(zurichDay('2026-07-01T22:30:00Z')).toBe('2026-07-02'); // summer time: +2 h
  });
  it('a Garmin CSV without times still works', () => {
    const { rides } = parseStravaCsv('Activity Type,Date,Title,Distance\nCycling,2026-10-15 07:12:33,Jura,"1,012.5"\n');
    expect(rides[0]).toMatchObject({ date: '2026-10-15', km: 1012.5, time: null, gear: '' });
    expect(() => parseStravaCsv('a,b\n1,2')).toThrow(/column not found/);
  });
});

describe('FIT files: unit, profile, bike sensors, start and distance', () => {
  it('reads a tiny synthetic file', () => {
    const bytes = fitRide({ start: '2026-10-04T06:00:00Z', km: 41.234, product: 3843, serial: 3300001, profile: 'Demo Neu', sensors: [{ serial: 0xa1b24f2a, type: 123 }, { serial: 777, type: 120 }] });
    const r = parseFit(bytes.buffer, 'ride.fit');
    expect(r).toMatchObject({ source: 'fit', date: '2026-10-04', time: '2026-10-04T06:00:00Z', km: 41.2, device: 'Edge 1040', serial: '3300001', profile: 'Demo Neu', cycling: true });
    // the heart rate strap goes with the rider: no fingerprint of a bike
    expect(r.sensors).toEqual([{ fp: 'A1B24F2A', kind: 'speed' }]);
    expect(sensorShort(r.sensors[0].fp)).toBe('…4F2A');
    expect(parseFit(fitRide({ start: '2026-10-04T06:00:00Z', km: 5, product: 4061, sport: 1 })).cycling).toBe(false);
    expect(parseFit(fitRide({ start: '2026-10-04T06:00:00Z', km: 5, product: 4061 })).device).toBe('Edge 540');
  });
  it('refuses a file that is no FIT file', () => {
    expect(() => parseFit(new TextEncoder().encode('Activity ID,Activity Date'))).toThrow(/not a FIT file/);
  });
});

describe('duplicates: two units, or the same ride from Strava and as a file', () => {
  const csv = { source: 'csv', date: '2026-09-26', time: '2026-09-26T08:00:00Z', km: 64.1, name: 'Pfannenstiel Gravel', gear: 'Demo Neu', stravaId: '77', sensors: [] };
  const fit1040 = { source: 'fit', date: '2026-09-26', time: '2026-09-26T08:02:00Z', km: 63.8, device: 'Edge 1040', profile: 'Gravel', sensors: [{ fp: 'A1B24F2A', kind: 'speed' }] };
  const fit540 = { source: 'fit', date: '2026-09-26', time: '2026-09-26T08:01:00Z', km: 64.5, device: 'Edge 540', profile: 'Gravel', sensors: [] };
  it('same day, km within 3 %, start within 30 minutes', () => {
    expect(sameRide(csv, fit1040)).toBe(true);
    expect(sameRide(csv, { ...fit1040, time: '2026-09-26T15:00:00Z' })).toBe(false);
    expect(sameRide(csv, { ...fit1040, km: 30 })).toBe(false);
    expect(sameRide({ ...csv, time: null }, { ...fit1040, date: '2026-09-27' })).toBe(false);
    expect(sameRide({ stravaId: '1', km: 5, date: 'x' }, { stravaId: '2', km: 5, date: 'x' })).toBe(false);
  });
  it('merged: the name and bike from Strava, unit, profile and sensors from the file', () => {
    const m = mergeRides(csv, fit1040);
    expect(m).toMatchObject({ source: 'fit', name: 'Pfannenstiel Gravel', gear: 'Demo Neu', stravaId: '77', device: 'Edge 1040', profile: 'Gravel', km: 63.8 });
    expect(m.sensors).toHaveLength(1);
  });
  it('the import merges them into one ride and marks rides already in the ledger', () => {
    const entries = [makeEntry({ bikeId: NEU, date: '2026-09-05', km: 0, kind: 'start' }), makeEntry({ bikeId: NEU, date: '2026-09-19', km: 72, kind: 'ride', source: 'fit' })];
    const plan = planImport([csv, fit1040, fit540, { source: 'csv', date: '2026-09-19', km: 72.3, name: 'Albis Kette', gear: 'Demo Neu' }], { bikes: BIKES, entries, rules: [] });
    const rows = plan.rows;
    expect(rows.filter((r) => !r.dup)).toHaveLength(1);
    expect(rows.filter((r) => r.dup === 'merged')).toHaveLength(2);
    expect(rows.find((r) => r.dup === 'known').ride.name).toBe('Albis Kette');
    expect(importEntries(plan, {}, 'imp1')).toHaveLength(1);
  });
});

describe('assignment: Sensor › Strava bike › profile rule › you, never silently', () => {
  const rules = [
    { id: 'r1', kind: 'sensor', value: 'A1B24F2A', bikeIds: [NEU] },
    { id: 'r2', kind: 'profile', value: 'Gravel', bikeIds: [GRAVEL, NEU] },
    { id: 'r3', kind: 'profile', value: 'MTB', bikeIds: [HT] },
    { id: 'r4', kind: 'profile', value: 'Downhill', bikeIds: [TRAIL] },
  ];
  const ctx = { bikes: BIKES, rules, usual: { [TRAIL]: [22, 28, 25, 19] } };
  const sensor = [{ fp: 'A1B24F2A', kind: 'speed' }];
  it('a sensor is sure; Strava bike or one profile is likely', () => {
    expect(assignRide({ km: 41, profile: 'Gravel', sensors: sensor }, ctx)).toMatchObject({ bikeId: NEU, by: 'sensor', sure: 'sure' });
    expect(assignRide({ km: 38, profile: 'Gravel', gear: 'Demo Neu', sensors: [] }, ctx)).toMatchObject({ bikeId: NEU, by: 'gear', sure: 'likely' });
    expect(assignRide({ km: 20, profile: 'MTB', sensors: [] }, ctx)).toMatchObject({ bikeId: HT, by: 'profile', sure: 'likely' });
    // answer 9a: a profile named like the bike needs no rule
    expect(assignRide({ km: 20, profile: 'demo rennvelo', sensors: [] }, { bikes: BIKES, rules: [] })).toMatchObject({ bikeId: 'test_data_gtp_renn', by: 'profile' });
  });
  it('the sensor wins over a Strava bike that says something else, but the ride waits for you', () => {
    const a = assignRide({ km: 41, gear: 'Demo Gravel', sensors: sensor }, ctx);
    expect(a).toMatchObject({ bikeId: NEU, by: 'sensor', sure: 'unclear', reason: { code: 'conflict', by: 'gear', said: GRAVEL } });
  });
  it('a contradiction between the Strava bike and the profile rule is shown', () => {
    const a = assignRide({ km: 14, gear: 'Demo Neu', profile: 'MTB', sensors: [] }, ctx);
    expect(a).toMatchObject({ bikeId: NEU, by: 'gear', sure: 'unclear', reason: { code: 'conflict', said: HT, strava: true } });
    expect(reasonText(a.reason, (id) => BIKES.find((b) => b.id === id).name)).toBe('Contradiction: Strava says Demo Neu, the rule for MTB says Demo Hardtail.');
  });
  it('a profile for two bikes, no signal, or an unusual distance: unclear', () => {
    expect(assignRide({ km: 30, profile: 'Gravel', sensors: [] }, ctx)).toMatchObject({ bikeId: null, sure: 'unclear', reason: { code: 'several' } });
    expect(assignRide({ km: 23, profile: 'Rad', sensors: [] }, ctx)).toMatchObject({ bikeId: null, sure: 'unclear', reason: { code: 'none', profile: 'Rad' } });
    expect(assignRide({ km: 23, gear: 'Altes Velo', sensors: [] }, ctx).reason).toMatchObject({ code: 'none', gear: 'Altes Velo' });
    const long = assignRide({ km: 52, profile: 'Downhill', sensors: [] }, ctx);
    expect(long).toMatchObject({ bikeId: TRAIL, sure: 'unclear', reason: { code: 'long', under: 30 } });
  });
  it('signals: a gear rule maps another Strava name', () => {
    expect(signals({ gear: 'Mein Gravel' }, { bikes: BIKES, rules: [{ kind: 'gear', value: 'Mein Gravel', bikeIds: [GRAVEL] }] }).gear).toBe(GRAVEL);
  });
  it('unclear rides are written as open (they do not count); your choice makes them count', () => {
    const plan = planImport(
      [
        { source: 'csv', date: '2026-10-03', km: 14, name: 'Feierabendrunde', gear: 'Demo Neu', profile: 'MTB', sensors: [] },
        { source: 'fit', date: '2026-10-04', km: 41, profile: 'Gravel', sensors: sensor },
        { source: 'fit', date: '2026-09-23', km: 23, profile: 'Rad', sensors: [] },
      ],
      { bikes: BIKES, rules, entries: [] },
    );
    const [unclear, sure, none] = plan.rows;
    let out = importEntries(plan, {}, 'imp');
    expect(out.map((x) => [x.bikeId, x.state, x.sure])).toEqual([[NEU, 'open', 'unclear'], [NEU, 'counted', 'sure'], [null, 'open', 'unclear']]);
    out = importEntries(plan, { [unclear.key]: { confirm: true }, [none.key]: { bikeId: GRAVEL }, [sure.key]: { bikeId: HT } }, 'imp');
    expect(out.map((x) => [x.bikeId, x.state, x.by])).toEqual([[NEU, 'counted', 'user'], [HT, 'counted', 'user'], [GRAVEL, 'counted', 'user']]);
    expect(out.every((x) => x.importId === 'imp' && x.date && x.source)).toBe(true);
  });
  it("Strava's own total per bike comes from every activity with that bike", () => {
    const plan = planImport(
      [
        { source: 'csv', date: '2026-10-04', km: 41.2, gear: 'Demo Neu', sensors: [] },
        { source: 'csv', date: '2026-09-04', km: 100, gear: 'Demo Neu', sensors: [] },
      ],
      { bikes: BIKES, rules, entries: [makeEntry({ bikeId: NEU, date: '2026-09-05', km: 0, kind: 'start' })] },
    );
    expect(plan.strava[NEU]).toEqual({ km: 141.2, date: '2026-10-04' });
    // the ride before the start day is in the start value already
    expect(plan.rows.find((r) => r.ride.date === '2026-09-04').dup).toBe('start');
  });
});

describe('start of the ledger, trips from the debrief', () => {
  it('a migrated counter includes the rides of its day; a start at pickup does not', () => {
    const mig = ledgerStart([makeEntry({ bikeId: NEU, date: '2026-10-04', km: 300, kind: 'start', inclusive: true })], NEU);
    expect(inStart(mig, '2026-10-04')).toBe(true);
    const pick = ledgerStart([makeEntry({ bikeId: NEU, date: '2026-09-05', km: 0, kind: 'start' })], NEU);
    expect([inStart(pick, '2026-09-05'), inStart(pick, '2026-09-04')]).toEqual([false, true]);
  });
  it('a trip entry from the debrief covers the rides of its days', () => {
    const span = tripSpan({ startDate: '2026-09-12' }, '2026-09-13');
    const trip = makeEntry({ bikeId: NEU, date: '2026-09-12', km: 120, kind: 'ride', span, tripId: 't1' });
    const plan = planImport([{ source: 'csv', date: '2026-09-13', km: 60, gear: 'Demo Neu', sensors: [] }], { bikes: BIKES, entries: [trip] });
    expect(plan.rows[0].dup).toBe('known');
    expect(tripRidesIn([trip, makeEntry({ bikeId: NEU, date: '2026-09-13', km: 60, kind: 'ride' })], NEU, span)).toHaveLength(1);
  });
});

describe('control: weekly reconcile, Q1 status, monthly report', () => {
  const entries = [
    makeEntry({ bikeId: NEU, date: '2026-09-05', km: 0, kind: 'start' }),
    makeEntry({ bikeId: NEU, date: '2026-10-02', km: 398, kind: 'ride' }),
    makeEntry({ bikeId: NEU, date: '2026-10-03', km: 14, kind: 'ride', state: 'open' }),
  ];
  const bike = { id: NEU, name: 'Demo Neu', km: 398, strava: { km: 412, date: '2026-10-04' } };
  it('Strava says 412, the app 398: the open ride of 14 km explains it', () => {
    const [r] = reconcile([bike], entries);
    expect(r).toMatchObject({ app: 398, strava: 412, diff: 14, explained: true });
    expect(r.open).toHaveLength(1);
    expect([matches(0.3), matches(1), matches(null)]).toEqual([true, false, false]);
  });
  it('part start points and km on a part, also km brought from another bike', () => {
    const chain = { key: 'chain', history: [{ date: '2026-09-05', km: 0, action: 'replace', result: 'done', start: true }, { date: '2026-09-20', km: 215, action: 'service', result: 'done' }] };
    const wheel = { key: 'wheelF', history: [{ date: '2026-09-20', km: 215, action: 'replace', result: 'done', carried: 1850, from: GRAVEL }] };
    const grips = { key: 'grips', history: [] };
    expect(partStart(chain)).toMatchObject({ date: '2026-09-05', km: 0, carried: 0 });
    expect(partKm({ km: 412 }, chain)).toBe(412);
    expect(partKm({ km: 412 }, wheel)).toBe(2047);
    expect(partStart(grips)).toBeNull();
    expect(partStart({ history: [{ date: '2026-09-05', km: null, action: 'replace' }] })).toBeNull();
    const q = q1Status({ ...bike, strava: { km: 398, date: '2026-10-04' } }, entries.slice(0, 2), [chain, wheel, grips]);
    expect(q.points.map((p) => p.ok)).toEqual([true, false, true, true]);
    expect(q.state).toBe('almost');
    expect(q.points[3].carried).toHaveLength(1);
  });
  it('the monthly report line per bike and the week', () => {
    const [m] = monthReport([bike], entries, () => [], '2026-10');
    expect(m).toMatchObject({ diff: 14, missing: 0, rides: 1, km: 398 });
    expect(m.last.date).toBe('2026-10-03');
    expect(prevMonth('2026-01-03')).toBe('2025-12');
    expect(isoWeek('2026-10-10')).toBe('2026-W41');
    expect(isoWeek('2026-10-12')).toBe('2026-W42');
    expect(isoWeek('2027-01-01')).toBe('2026-W53');
  });
});

describe('database: import, undo, change, delete', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`km-db-${Math.random()}`);
    await db.bikes.bulkPut([{ id: NEU, name: 'Demo Neu', km: 0, kmDate: '2026-09-05' }, { id: GRAVEL, name: 'Demo Gravel' }]);
    await ensureKmBook(db, '2026-09-05');
  });
  it('an import writes rides and Strava totals; Undo takes all of it back', async () => {
    const entries = [makeEntry({ bikeId: NEU, date: '2026-09-06', km: 18, importId: 'i1' }), makeEntry({ bikeId: GRAVEL, date: '2026-09-07', km: 30, importId: 'i1' })];
    await applyImport(db, { entries, strava: { [NEU]: { km: 18, date: '2026-09-06' } }, importId: 'i1' });
    expect((await db.bikes.get(NEU)).km).toBe(18);
    expect((await db.bikes.get(NEU)).strava.km).toBe(18);
    expect((await db.bikes.get(GRAVEL)).km).toBe(30);
    await undoImport(db, 'i1');
    expect(await db.kmBook.count()).toBe(1);
    expect((await db.bikes.get(NEU)).km).toBe(0);
    expect((await db.bikes.get(NEU)).strava).toBeNull();
    expect((await db.bikes.get(GRAVEL)).km).toBeNull();
  });
  it('confirming an open ride counts it; Undo puts it back', async () => {
    const [id] = await addEntries(db, [makeEntry({ bikeId: NEU, date: '2026-10-03', km: 14, state: 'open', sure: 'unclear' })]);
    expect((await db.bikes.get(NEU)).km).toBe(0);
    const prev = await updateEntry(db, id, { state: 'counted', by: 'user', sure: 'user' });
    expect((await db.bikes.get(NEU)).km).toBe(14);
    await restoreEntries(db, { put: [prev] });
    expect((await db.bikes.get(NEU)).km).toBe(0);
    const gone = await deleteEntries(db, [id]);
    expect(gone).toHaveLength(1);
    expect(await db.kmBook.get(id)).toBeUndefined();
  });
});
