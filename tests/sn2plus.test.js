// SN2+ «SN2 plus» (mockups SN2e–SN2i approved 13.10.2026): the numbers behind «Puls und Leistung», «Aus
// Vorlage», the Logbuch chips, the pace per bike and surface, planned and ridden, the months, the zones.
// Fictional activities: one with a power meter, one with Strava's estimate, one without power.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { surfaceOfType, surfaceOf, standardZones, zoneTimes, zoneRows, validBounds, tripValues, tripEntries, tempoRides, paceGrid, paceFor, usualSurface, plannedRidden, monthKeys, monthly, lastOf, withUploads, chipCounts, CELL_MIN } from '../src/lib/review/werte.js';
import { zonesOf, hasActivities, loadActs, maxHeart } from '../src/lib/review/actdata.js';
import { dropItem, putBack, inTemplate, unusedBefore, tripTemplate } from '../src/lib/review/fromtemplate.js';
import { logFilter } from '../src/lib/review/logbook.js';
import { templateItems } from '../src/lib/templates.js';

const BOUNDS = [117, 137, 153, 168];
// measured power (power meter), estimated power (no meter), no power at all
const A_METER = { id: 11, day: '2026-10-06', km: 62, hm: 1180, movingS: 11100, type: 'Ride', hrAvg: 138, hrMax: 176, hist: { 110: 1080, 130: 4440, 145: 3120, 160: 1860, 175: 600 }, wAvg: 186, wMax: 742, wDevice: true, w20: 248 };
const A_EST = { id: 12, day: '2026-09-30', km: 60, hm: 900, movingS: 12000, type: 'GravelRide', hrAvg: 131, hrMax: 168, hist: { 112: 3840, 130: 9480 }, wAvg: 152, wMax: 590, wDevice: false, w20: null };
const A_NONE = { id: 13, day: '2026-09-23', km: 74, hm: 790, movingS: 13260, type: 'MountainBikeRide', hrAvg: 125, hrMax: 160, hist: null, wAvg: null, wMax: null, wDevice: null, w20: null };

describe('surface (answer 3 «a und sonst b»)', () => {
  it('comes from the Strava sport type, else the bike; your choice on the ride wins', () => {
    expect(surfaceOfType('Ride')).toBe('road');
    expect(surfaceOfType('Gravel Ride')).toBe('gravel');
    expect(surfaceOfType('GravelRide')).toBe('gravel');
    expect(surfaceOfType('Mountain Bike Ride')).toBe('trail');
    expect(surfaceOfType('E-Mountain Bike Ride')).toBe('trail');
    expect(surfaceOfType('Run')).toBeNull();
    expect(surfaceOfType('')).toBeNull();
    const bike = { id: 'b', surface: 'gravel' };
    expect(surfaceOf({ type: '' }, bike)).toBe('gravel');
    expect(surfaceOf({ type: 'Ride' }, bike)).toBe('road');
    expect(surfaceOf({ type: 'Ride', surface: 'trail' }, bike)).toBe('trail');
    expect(surfaceOf({ type: '' }, null)).toBeNull();
  });
});

describe('zones', () => {
  it('the standard zones from the highest heart rate, and seconds per zone from a histogram', () => {
    expect(standardZones(190)).toEqual([114, 133, 152, 171]);
    expect(standardZones(null)).toBeNull();
    expect(validBounds(BOUNDS)).toBe(true);
    expect(validBounds([150, 140, 160, 170])).toBe(false);
    expect(zoneTimes({ 100: 60, 117: 30, 118: 10, 200: 5 }, BOUNDS)).toEqual([90, 10, 0, 0, 5]);
    expect(zoneTimes(null, BOUNDS)).toBeNull();
    expect(zoneRows(BOUNDS).map((r) => [r.from, r.to])).toEqual([[null, 117], [118, 137], [138, 153], [154, 168], [169, null]]);
  });
  it('your own zones first, else the standard from the ledger’s highest heart rate, else none', () => {
    expect(zonesOf({ bounds: BOUNDS }, [])).toEqual({ bounds: BOUNDS, source: 'own', max: null });
    expect(zonesOf(null, [{ hrMax: 180, state: 'counted' }, { hrMax: 190, state: 'removed' }])).toEqual({ bounds: standardZones(180), source: 'standard', max: 180 });
    expect(zonesOf(null, [])).toBeNull();
    expect(maxHeart([], [{ hrMax: 171 }])).toBe(171);
  });
});

describe('«Puls und Leistung» of a trip (SN2e)', () => {
  it('with a power meter: zones, heart rate, power and the best 20 min', () => {
    const v = tripValues({ acts: [A_METER], bounds: BOUNDS });
    expect(v.hrAvg).toBe(138);
    expect(v.hrMax).toBe(176);
    expect(v.zones.map((z) => z.s)).toEqual([1080, 4440, 3120, 1860, 600]);
    expect(v.zoneS).toBe(11100);
    expect(v.zones.map((z) => z.pct)).toEqual([10, 40, 28, 17, 5]);
    expect(v.power).toEqual({ avg: 186, max: 742, w20: 248, measured: true });
  });
  it('without a power meter: power is Strava’s estimate and there are no best 20 min', () => {
    const v = tripValues({ acts: [A_EST], bounds: BOUNDS });
    expect(v.power).toEqual({ avg: 152, max: 590, w20: null, measured: false });
  });
  it('without power: only heart rate; one ride with a meter and one without counts as estimated', () => {
    expect(tripValues({ acts: [A_NONE], bounds: BOUNDS }).power).toBeNull();
    const both = tripValues({ acts: [A_METER, A_EST], bounds: BOUNDS });
    expect(both.power.measured).toBe(false);
    expect(both.power.w20).toBeNull();
    expect(both.power.max).toBe(742);
  });
  it('no activities yet: the heart rate comes from the ride ledger (kmBook); nothing known gives null', () => {
    const entries = [
      { source: 'strava', kind: 'ride', state: 'counted', date: '2026-10-06', km: 40, hrAvg: 140, hrMax: 170, bikeId: 'b1' },
      { source: 'strava', kind: 'ride', state: 'counted', date: '2026-10-07', km: 20, hrAvg: 128, hrMax: 181, bikeId: 'b1' },
      { source: 'strava', kind: 'ride', state: 'counted', date: '2026-10-09', km: 20, hrAvg: 99, hrMax: 120, bikeId: 'b1' },
      { source: 'strava', kind: 'ride', state: 'counted', date: '2026-10-06', km: 20, hrAvg: 99, hrMax: 120, bikeId: 'other' },
    ];
    const trip = { startDate: '2026-10-06', days: 2, bikeId: 'b1' };
    const mine = tripEntries(entries, trip, '2026-10-07');
    expect(mine).toHaveLength(2);
    const v = tripValues({ acts: [], entries: mine, bounds: BOUNDS });
    expect(v).toMatchObject({ hrAvg: 136, hrMax: 181, zones: null, power: null });
    expect(tripValues({ acts: [], entries: [], bounds: BOUNDS })).toBeNull();
  });
});

describe('the pace per bike and surface (SN2h, answer 4b: from 5 rides)', () => {
  const bikes = [{ id: 'road', name: 'Rennvelo Blau' }, { id: 'grav', name: 'Gravel Grinder', surface: 'gravel' }];
  const ride = (n, extra = {}) => ({ id: `r${n}`, name: `Fahrt ${n}`, date: `2026-0${(n % 8) + 1}-1${n % 9}`, km: 60, gainM: 600, movingH: 2.5, totalH: 2.8, use: true, ...extra });
  it('a GPX ride takes the bike and the sport type of the ledger ride on the same day', () => {
    const paceRides = [ride(1)];
    const entries = [{ id: 'e1', kind: 'ride', state: 'counted', date: paceRides[0].date, km: 61, bikeId: 'road', type: 'Ride', hrAvg: 140, surface: null }];
    const [r] = tempoRides({ paceRides, entries });
    expect(r).toMatchObject({ from: 'pace', bikeId: 'road', type: 'Ride', entryId: 'e1', hrAvg: 140 });
    expect(surfaceOf(r, bikes[0])).toBe('road');
  });
  it('an activity counts once, even when the same ride was also uploaded as GPX', () => {
    const entries = [{ id: 'e2', kind: 'ride', state: 'counted', date: A_METER.day, km: 62, bikeId: 'road', stravaId: '11', surface: 'gravel' }];
    const rides = tempoRides({ acts: [A_METER], entries, paceRides: [{ id: 'g', date: A_METER.day, km: 62.4, gainM: 1100, movingH: 3, use: true }] });
    expect(rides).toHaveLength(1);
    expect(rides[0]).toMatchObject({ from: 'act', bikeId: 'road', surface: 'gravel', wDevice: true });
  });
  it(`counts from ${CELL_MIN} rides, below that the rule; the trip takes the bike’s own pace`, () => {
    const four = Array.from({ length: 4 }, (_, n) => ({ ...ride(n), bikeId: 'grav', type: '' }));
    let grid = paceGrid(four, bikes);
    expect(grid).toHaveLength(1);
    expect(grid[0].cells.gravel).toMatchObject({ n: 4, counts: false });
    expect(grid[0].cells.road).toMatchObject({ n: 0, counts: false });
    const rule = { kmh: 21, climbMh: 550, mine: true, standard: false };
    expect(paceFor(rule, grid, 'grav', 'gravel')).toBe(rule);
    grid = paceGrid([...four, { ...ride(9), bikeId: 'grav', type: '' }], bikes);
    expect(grid[0].cells.gravel).toMatchObject({ n: 5, counts: true });
    const p = paceFor(rule, grid, 'grav', usualSurface(bikes[1], []));
    expect(p.cell).toEqual({ bikeId: 'grav', surface: 'gravel', n: 5 });
    expect(p.kmh).toBe(grid[0].cells.gravel.kmh);
    // the standard you chose stays the standard; another surface keeps the rule
    expect(paceFor({ ...rule, standard: true }, grid, 'grav', 'gravel').cell).toBeUndefined();
    expect(paceFor(rule, grid, 'grav', 'road')).toBe(rule);
  });
  it('a bike without a fixed surface takes the surface it rides most', () => {
    const rides = [{ ...ride(1), bikeId: 'road', type: 'Ride' }, { ...ride(2), bikeId: 'road', type: 'Ride' }, { ...ride(3), bikeId: 'road', type: 'Gravel Ride' }];
    expect(usualSurface(bikes[0], rides)).toBe('road');
    expect(usualSurface(bikes[1], rides)).toBe('gravel');
  });
});

describe('planned and ridden (SN2h)', () => {
  it('per trip with both times, the difference in minutes and the average without a sign', () => {
    const trip = (id, plan, real) => ({ id, kind: 'trip', title: id, start: '2026-10-01', end: '2026-10-01', bike: 'Velo', km: 60, gainM: 800, movingH: real, kmh: 20, trip: { id, bikeId: 'b', route: { km: 58, gainM: 820 } }, rides: [{ km: 60, gainM: 800, movingH: real, plan: { hours: plan, km: 58, gainM: 820 } }] });
    const { rows, avgMin } = plannedRidden([trip('a', 3, 3.25), trip('b', 4, 3.5), { kind: 'ride', id: 'solo' }]);
    expect(rows.map((r) => r.diffMin)).toEqual([15, -30]);
    expect(rows[0]).toMatchObject({ planKm: 58, planGain: 820, km: 60 });
    expect(avgMin).toBe(23);
  });
});

describe('the months (SN2i, answer 5b: all months since the first ride)', () => {
  it('every month from the first ride to today, also the empty ones', () => {
    expect(monthKeys('2025-11-20', '2026-02-03')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(monthKeys(null, '2026-02-03')).toEqual([]);
  });
  it('an uploaded ride left out of «Dein Tempo» still counts for its month, once', () => {
    const rides = [{ id: 'pace:u1', paceId: 'u1', date: '2026-09-01', km: 50, movingH: 2.5 }];
    const out = withUploads(rides, [{ id: 'u1', date: '2026-09-01', km: 50, movingH: 2.5 }, { id: 'u2', date: '2026-08-01', km: 40, movingH: 2, pace: false }, { id: 'u3', date: '2026-08-02', km: 40, movingH: null }]);
    expect(out.map((r) => r.id)).toEqual(['pace:u1', 'ride:u2']);
  });
  it('km/h, heart rate from the ledger, measured power before the estimate, zones', () => {
    const rides = tempoRides({ acts: [A_METER, A_EST, A_NONE] });
    const entries = [{ source: 'strava', kind: 'ride', state: 'counted', date: '2026-08-02', km: 50, hrAvg: 141, hrMax: 177 }];
    const ms = monthly({ rides, entries, bounds: BOUNDS, today: '2026-10-13' });
    expect(ms.map((m) => m.ym)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(ms[0]).toMatchObject({ n: 0, kmh: null, hrAvg: 141, hrMax: 177 });
    expect(ms[1]).toMatchObject({ n: 2, wAvg: 152, west: true, w20: null });
    expect(ms[1].kmh).toBeCloseTo(134 / ((12000 + 13260) / 3600), 1);
    expect(ms[2]).toMatchObject({ n: 1, wAvg: 186, wMax: 742, w20: 248, west: false, zoneS: 11100 });
    expect(lastOf(ms, 'hrAvg')).toMatchObject({ ym: '2026-08', v: 141 });
    expect(lastOf(ms, 'w20')).toMatchObject({ ym: '2026-10', v: 248 });
  });
});

describe('«Aus Vorlage» (SN2f)', () => {
  const items = [
    { id: 'A', name: 'Taschenbuch', ownership: 'owned', domains: ['bikepacking'], sets: ['lesen'] },
    { id: 'B', name: 'Hoodie', ownership: 'owned', domains: ['bikepacking'], sets: [] },
    { id: 'C', name: 'Ersatzschlauch', ownership: 'owned', domains: ['bikepacking'], sets: [] },
  ];
  const sets = [{ key: 'lesen', name: 'Lesen', items: ['A'] }];
  it('a block item goes to «without», an extra leaves the extras; Undo puts exactly that back', () => {
    const tpl = { id: 't1', name: 'Jura-Wochenende', domain: 'bikepacking', blocks: ['lesen'], without: {}, extras: [{ itemId: 'B', qty: 1 }], slots: {}, qty: {} };
    expect(inTemplate(tpl, 'A', items, sets)).toBe(true);
    expect(inTemplate(tpl, 'C', items, sets)).toBe(false);
    expect(dropItem(tpl, 'C', items, sets)).toBeNull();
    const a = dropItem(tpl, 'A', items, sets);
    expect(a.tpl.without).toEqual({ lesen: ['A'] });
    expect(templateItems(a.tpl, items, sets).map((x) => x.itemId)).toEqual(['B']);
    const b = dropItem(a.tpl, 'B', items, sets);
    expect(b.tpl.extras).toEqual([]);
    // undo the first one only: the second stays out
    const back = putBack(b.tpl, a.undo);
    expect(templateItems(back, items, sets).map((x) => x.itemId)).toEqual(['A']);
    expect(back.without).toEqual({});
  });
  it('an older template (entries only) loses and gets back its entry', () => {
    const old = { id: 't2', name: 'Alt', entries: [{ itemId: 'A', slot: 'seat', qty: 1 }, { itemId: 'B', slot: 'top', qty: 2 }] };
    const out = dropItem(old, 'B', items, sets);
    expect(out.tpl.entries.map((e) => e.itemId)).toEqual(['A']);
    expect(putBack(out.tpl, out.undo).entries).toEqual(old.entries);
  });
  it('the trip’s template only while it exists and is not archived; «not used before» counts earlier trips only', () => {
    expect(tripTemplate({ templateId: 't1' }, [{ id: 't1', archivedAt: '2026-01-01' }])).toBeNull();
    expect(tripTemplate({ templateId: 't1' }, [{ id: 't1' }])).toEqual({ id: 't1' });
    const trips = [{ id: 'x', startDate: '2026-09-01' }, { id: 'y', startDate: '2026-09-30' }, { id: 'z', startDate: '2026-10-05' }];
    const debriefs = trips.map((tr) => ({ tripId: tr.id, status: 'done', items: { B: 'unused' } }));
    expect(unusedBefore(debriefs, trips, trips[1])).toEqual({ B: 1 });
  });
});

describe('Logbuch: Velo and Reiseart (SN2g)', () => {
  const e = (id, bike, domain) => ({ id, year: '2026', domain, title: id, notes: [], fact: { bike, learnings: [] }, ev: null });
  const entries = [e('a', 'Gravel Grinder', 'bikepacking'), e('b', 'Gravel Grinder', 'hiking'), e('c', 'Rennvelo Blau', 'bikepacking'), { ...e('d', null, 'bikepacking'), fact: null }];
  it('filters by bike and kind together, with counts per chip', () => {
    expect(logFilter(entries, { bike: 'Gravel Grinder' }).map((x) => x.id)).toEqual(['a', 'b']);
    expect(logFilter(entries, { bike: 'Gravel Grinder', area: 'bikepacking' }).map((x) => x.id)).toEqual(['a']);
    expect(chipCounts(entries, (x) => x.fact?.bike ?? null)).toEqual([{ key: 'Gravel Grinder', n: 2 }, { key: 'Rennvelo Blau', n: 1 }]);
    expect(chipCounts(entries, (x) => x.domain)).toEqual([{ key: 'bikepacking', n: 3 }, { key: 'hiking', n: 1 }]);
  });
});

describe('the database side', () => {
  it('the activities table (since «Training», Dexie version 10): empty gives [] and no error', async () => {
    const db = createDb('sn2plus-a');
    expect(hasActivities(db)).toBe(true);
    expect(await loadActs(db)).toEqual([]);
  });
  it('the bike’s surface, a ride’s surface and your zones survive a backup', async () => {
    const db = createDb('sn2plus-b');
    await db.bikes.put({ id: 'grav', name: 'Gravel Grinder', surface: 'gravel' });
    await db.kmBook.put({ id: 'km-1', bikeId: 'grav', date: '2026-10-01', km: 50, kind: 'ride', source: 'strava', state: 'counted', type: 'Ride', surface: 'trail' });
    await db.settings.put({ key: 'hrZones', value: { bounds: BOUNDS, at: '2026-10-13T10:00:00.000Z' } });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    const other = createDb('sn2plus-c');
    await restoreBackup(other, file, 'replace');
    expect(await other.bikes.get('grav')).toMatchObject({ surface: 'gravel' });
    expect(await other.kmBook.get('km-1')).toMatchObject({ surface: 'trail' });
    expect((await other.settings.get('hrZones')).value.bounds).toEqual(BOUNDS);
  });
});
