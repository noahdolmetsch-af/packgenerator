// SN4g–SN4i «Touren-Seite, Runde 2» (Noah 13.10.2026 «SN4g–SN4i freigegeben»): the filters FL1–FL8 with their
// counts and saving, the Packmodus band, the values of a row with and without a power meter, the tiles' filter
// rule (O1 never filtered, O2 and O5 the rows shown) and the numbers of the new «In Zahlen» blocks.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { KINDS, DURS, WXS, COLD_C, HOT_C, emptyFilter, normFilter, kindOf, matches, filterRows, choiceCounts, activeChips, activeCount, withoutChip, toggle, sameFilter, toursOf, saveFilter, dropFilter } from '../src/lib/touren/filter.js';
import { packBand, tileRows, PACK_HREF } from '../src/lib/touren.js';
import { rowValues } from '../src/lib/review/inzahlen.js';
import { actOf } from '../src/lib/review/actdata.js';
import { tourViewOf, valueMonths, newestOf, rowsGrid, wearPerBike, compareGroups, bikeOfRow } from '../src/lib/review/tourzahlen.js';
import { TOUR_BLOCKS, TOUR_GROUPS, TOUR_BLOCK_KEYS, TOUR_GROUP_KEYS, BLOCKS } from '../src/lib/review/pastcols.js';
import { SK_BIG } from '../src/lib/sk/pages.js';

const trip = (id, extra = {}) => ({ id, title: id, startDate: '2026-09-01', days: 1, bikeId: 'b-gravel', entries: [], ...extra });
const row = (id, extra = {}) => {
  const tr = extra.trip === null ? null : trip(id, extra.trip ?? {});
  return { id, kind: tr ? 'trip' : 'ride', trip: tr, title: id, start: '2026-09-01', end: '2026-09-01', days: tr?.days ?? 1, art: (tr?.days ?? 1) > 1 ? 'multi' : 'day', km: 50, gainM: 600, rain: { wet: false, days: [] }, tmin: 10, tmax: 18, rides: [], ...extra, ...(extra.trip !== undefined ? { trip: tr } : {}) };
};
// seven made-up trips: day rides, a bikepacking night, a race, an uploaded ride, rain, cold and heat
const ROWS = [
  row('day-road', { trip: { bikeId: 'b-road' }, km: 62, gainM: 1180 }),
  row('day-gravel', { km: 74, gainM: 790 }),
  row('night', { trip: { days: 2, overnight: 'outdoor' }, km: 110, gainM: 1640 }),
  row('race', { trip: { event: true }, art: 'event', km: 90, gainM: 1010 }),
  row('gpx', { trip: null, km: 41, gainM: 520 }),
  row('rain', { rain: { wet: true, days: [1] }, tmin: 9, tmax: 17, km: 30, gainM: 300 }),
  row('cold-hot', { tmin: 2, tmax: 30, km: 20, gainM: null }),
];
const watts = new Set(['day-road']);
const ctx = { bikeOf: (r) => r.trip?.bikeId ?? null, wattsOf: (r) => watts.has(r.id) };
const ids = (rs) => rs.map((r) => r.id);

describe('SN4g filters FL1–FL8', () => {
  it('an empty filter shows every row; a broken stored one is normalised', () => {
    expect(filterRows(ROWS, emptyFilter(), ctx)).toHaveLength(ROWS.length);
    expect(normFilter({ kinds: ['day', 'nope'], dur: 'x', km: ['5', -1], watts: 'yes' })).toEqual({ kinds: ['day'], bikes: [], dur: 'all', km: [5, null], hm: [null, null], wx: [], watts: false });
    expect(activeCount(emptyFilter())).toBe(0);
  });

  it('FL1 kind: day, bikepacking, race and the uploaded ride («Fahrt aus GPX»); one field is «or»', () => {
    expect(kindOf(ROWS[0])).toBe('day');
    expect(kindOf(ROWS[2])).toBe('bikepacking');
    expect(kindOf(ROWS[3])).toBe('event');
    expect(kindOf(ROWS[4])).toBe('ride');
    expect(ids(filterRows(ROWS, { kinds: ['bikepacking', 'ride'] }, ctx))).toEqual(['night', 'gpx']);
    expect(KINDS.map((k) => k.key)).toContain('ride');
  });

  it('FL2 bike, FL4 duration, FL5 km and Hm from–to (a row without Hm drops out once Hm is set)', () => {
    expect(ids(filterRows(ROWS, { bikes: ['b-road'] }, ctx))).toEqual(['day-road']);
    expect(ids(filterRows(ROWS, { dur: 'multi' }, ctx))).toEqual(['night']);
    expect(filterRows(ROWS, { dur: 'one' }, ctx)).toHaveLength(ROWS.length - 1);
    expect(ids(filterRows(ROWS, { km: [60, 100] }, ctx))).toEqual(['day-road', 'day-gravel', 'race']);
    expect(ids(filterRows(ROWS, { km: [null, 30] }, ctx))).toEqual(['rain', 'cold-hot']);
    expect(ids(filterRows(ROWS, { hm: [0, 600] }, ctx))).toEqual(['gpx', 'rain']);
    expect(DURS.map((d) => d.key)).toEqual(['all', 'one', 'multi']);
  });

  it('FL6 weather (rain, below 5 °C, above 28 °C) and FL7 only with power values; fields together are «and»', () => {
    expect([COLD_C, HOT_C]).toEqual([5, 28]);
    expect(WXS.map((w) => w.key)).toEqual(['rain', 'cold', 'hot']);
    expect(ids(filterRows(ROWS, { wx: ['rain'] }, ctx))).toEqual(['rain']);
    expect(ids(filterRows(ROWS, { wx: ['cold', 'hot'] }, ctx))).toEqual(['cold-hot']);
    expect(ids(filterRows(ROWS, { watts: true }, ctx))).toEqual(['day-road']);
    expect(filterRows(ROWS, { watts: true, bikes: ['b-gravel'] }, ctx)).toEqual([]);
    expect(matches(ROWS[0], { watts: true, bikes: ['b-road'], km: [50, null] }, ctx)).toBe(true);
  });

  it('every choice shows its number over the rows of the period', () => {
    const c = choiceCounts(ROWS, ctx);
    expect(c.kinds).toMatchObject({ day: 4, bikepacking: 1, event: 1, ride: 1, multi: 0, other: 0 });
    expect(c.bikes).toEqual({ 'b-road': 1, 'b-gravel': 5 });
    expect(c.dur).toEqual({ all: 7, one: 6, multi: 1 });
    expect(c.wx).toEqual({ rain: 1, cold: 1, hot: 1 });
    expect(c.watts).toBe(1);
  });

  it('the active filters are chips: each can be tapped away, the count is on «Filter»', () => {
    let f = toggle(toggle(emptyFilter(), 'bikes', 'b-road'), 'wx', 'rain');
    f = normFilter({ ...f, watts: true, km: [10, null], dur: 'one' });
    const chips = activeChips(f, { 'b-road': 'Rennvelo Blau' });
    expect(chips.map((c) => c.id)).toEqual(['bike:b-road', 'dur', 'km', 'wx:rain', 'watts']);
    expect(chips[0]).toMatchObject({ label: 'Bike: {name}', vars: { name: 'Rennvelo Blau' } });
    expect(chips[2]).toMatchObject({ label: 'from {lo} {unit}', vars: { lo: 10, unit: 'km' } });
    expect(activeCount(f)).toBe(5);
    for (const c of chips) expect(activeCount(withoutChip(f, c))).toBe(4);
    expect(toggle(f, 'bikes', 'b-road').bikes).toEqual([]);
  });

  it('FL8: save under a name (same name replaces), an empty name or filter saves nothing, delete, the same filter is found', () => {
    const f = normFilter({ bikes: ['b-road'], watts: true });
    let saved = saveFilter([], 'Rennvelo mit Watt', f, 'a');
    expect(saved).toEqual([{ id: 'a', name: 'Rennvelo mit Watt', f }]);
    expect(saveFilter(saved, '  ', f)).toBe(saved);
    expect(saveFilter(saved, 'Leer', emptyFilter())).toBe(saved);
    saved = saveFilter(saved, 'rennvelo mit watt', normFilter({ watts: true }), 'b');
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ id: 'a', f: { watts: true, bikes: [] } });
    saved = saveFilter(saved, 'Regentouren', normFilter({ wx: ['rain'] }), 'c');
    expect(saved.map((s) => s.name)).toEqual(['rennvelo mit watt', 'Regentouren']);
    expect(dropFilter(saved, 'a').map((s) => s.id)).toEqual(['c']);
    expect(sameFilter({ wx: ['rain'], bikes: ['x', 'y'] }, { bikes: ['y', 'x'], wx: ['rain'] })).toBe(true);
    expect(sameFilter({ wx: ['rain'] }, { wx: ['rain'], watts: true })).toBe(false);
    // the page record: broken entries are dropped, the band is shown unless hidden
    expect(toursOf({ saved: [{ id: 'x', name: '' }, { id: 'y', name: 'Ok', f: { wx: ['rain'] } }], band: 'hidden' })).toMatchObject({ saved: [{ id: 'y', name: 'Ok' }], band: 'hidden' });
    expect(toursOf(null)).toEqual({ saved: [], actSaved: [], band: null });
  });
});

describe('SN4g Packmodus band', () => {
  const planned = (id, n, packed, kind = 'trip') => ({ row: { id, tripId: id, title: id, kind, state: { key: 'packing' } }, trip: trip(id, { entries: Array.from({ length: n }, (_, i) => ({ itemId: `i${i}`, packed: i < packed })) }) });
  it('a planned trip with a packing list is a pack draft: the trip open in Packen first, else the first planned one', () => {
    const a = planned('a', 26, 14);
    const b = planned('b', 22, 4);
    const rows = [a.row, b.row];
    const trips = [a.trip, b.trip];
    expect(packBand(rows, trips, null)).toMatchObject({ state: 'draft', tripId: 'a', done: 14, total: 26 });
    expect(packBand(rows, trips, 'b')).toMatchObject({ state: 'draft', tripId: 'b', done: 4, total: 22 });
    expect(PACK_HREF).toBe('#/pack?day');
  });
  it('nothing open: no planned trip, or none with a list, or only one under way', () => {
    const empty = planned('e', 0, 0);
    const ride = planned('r', 5, 5, 'ride');
    expect(packBand([], [], null)).toEqual({ state: 'none' });
    expect(packBand([empty.row], [empty.trip], 'e')).toEqual({ state: 'none' });
    expect(packBand([ride.row], [ride.trip], 'r')).toEqual({ state: 'none' });
  });
});

describe('SN4g values of a row', () => {
  const r = { id: 'napf', kind: 'trip', trip: trip('napf', { startDate: '2026-10-06', bikeId: 'b-road' }), start: '2026-10-06', end: '2026-10-06', km: 62, gainM: 1180, rides: [] };
  it('with a power meter: Ø and max. power and NP', () => {
    const acts = [actOf({ id: 1, day: '2026-10-06', km: 62, movingS: 3 * 3600 + 300, elapsedS: 3 * 3600 + 52 * 60, hrAvg: 138, hrMax: 176, wAvg: 186, wMax: 742, wNorm: 214, wDevice: true, tempAvg: 11 })];
    const v = rowValues(r, { acts, bikes: [{ id: 'b-road', name: 'Rennvelo Blau' }] });
    expect(v).toMatchObject({ watts: true, wAvg: 186, wMax: 742, wNorm: 214, movingS: 11100, elapsedS: 13920, bikeId: 'b-road', tempAvg: 11 });
    expect(v.kmh).toBeCloseTo(20.1, 1);
    expect(bikeOfRow(r, { napf: v })).toBe('b-road');
  });
  it('without a power meter (Strava estimate or nothing): no power values, NP never guessed', () => {
    const est = [actOf({ id: 2, day: '2026-10-06', km: 62, movingS: 3600 * 3, wAvg: 150, wMax: 400, wDevice: false })];
    expect(rowValues(r, { acts: est })).toMatchObject({ watts: false, wAvg: null, wMax: null, wNorm: null });
    expect(rowValues(r, { acts: [] })).toMatchObject({ watts: false, wAvg: null, movingS: null, hrAvg: null });
  });
});

describe('SN4i tiles and the filters', () => {
  const states = { a: { state: 'done' }, b: { state: 'rated' }, c: { state: 'done' } };
  it('O2 «Offene Rückblicke» and O5 «Karte» read only the rows shown; O1 is never filtered', () => {
    const all = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(ids(tileRows(all, states).open)).toEqual(['a', 'c']);
    expect(ids(tileRows(all, states).map)).toEqual(['a', 'b', 'c']);
    const shown = [{ id: 'c' }];
    expect(ids(tileRows(shown, states).open)).toEqual(['c']);
    expect(ids(tileRows(shown, states).map)).toEqual(['c']);
    expect(SK_BIG.trips.map((d) => [d.id, d.filtered, d.size])).toEqual([['o1', false, 'mid'], ['o2', true, 'mid'], ['o5', true, 'big']]);
  });
});

describe('SN4h «In Zahlen» on Touren', () => {
  it('five groups, every block from an earlier round, the map is the tile O5', () => {
    expect(TOUR_GROUPS.map((g) => g.key)).toEqual(['dist', 'tempo', 'bikes', 'body', 'records']);
    expect(TOUR_BLOCK_KEYS).not.toContain('V7');
    for (const b of TOUR_BLOCKS) expect(TOUR_GROUP_KEYS).toContain(b.group);
    for (const k of ['V1', 'V10', 'V3', 'V12', 'V8', 'V2', 'V6', 'V9', 'V11']) expect(BLOCKS.map((b) => b.key)).toContain(k);
    expect(tourViewOf({ off: ['T1', 'zz'], shut: ['V2'] })).toEqual({ off: ['T1'], shut: ['V2'], open: TOUR_GROUP_KEYS, hide: [] });
    expect(tourViewOf(null).open).toEqual(TOUR_GROUP_KEYS);
  });

  it('T1 / P1: per month km/h, Ø and max. heart rate and power (power meter only), the newest month', () => {
    const rows = [
      { id: 'x', start: '2026-09-03', km: 60 },
      { id: 'y', start: '2026-09-20', km: 40 },
      { id: 'z', start: '2026-10-06', km: 62 },
    ];
    const vals = { x: { movingS: 3 * 3600, hrAvg: 130, hrMax: 160 }, y: { movingS: 2 * 3600, hrAvg: 140, hrMax: 170 }, z: { movingS: 3 * 3600, hrAvg: null, wAvg: 186, wMax: 742 } };
    const m = valueMonths(rows, ['2026-08', '2026-09', '2026-10'], vals);
    expect(m[0]).toMatchObject({ n: 0, kmh: null, hrAvg: null });
    expect(m[1]).toMatchObject({ n: 2, kmh: 20, hrAvg: 135, hrMax: 170, wAvg: null });
    expect(m[2]).toMatchObject({ n: 1, kmh: 20.7, wAvg: 186, wMax: 742 });
    expect(newestOf(m, 'hrAvg')).toEqual({ ym: '2026-09', v: 135 });
    expect(newestOf(m, 'nothing')).toBeNull();
  });

  it('T2 per bike and surface, U2 wear per bike, C1 the comparison groups', () => {
    const bikes = [{ id: 'b-gravel', name: 'Gravel Grinder', surface: 'gravel', km: 1120, parts: [{ key: 'chain', history: [{ action: 'replace', km: 0 }] }] }, { id: 'b-city', name: 'Stadtvelo' }];
    const rows = [ROWS[1], ROWS[2]];
    const vals = { 'day-gravel': { movingS: 3.7 * 3600 }, night: { movingS: 6.3 * 3600 } };
    const g = rowsGrid(rows, vals, bikes);
    expect(g).toHaveLength(1);
    expect(g[0].cells.gravel.n).toBe(2);
    const w = wearPerBike(rows, bikes, vals);
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ n: 2, km: 184, gainM: 2430 });
    expect(w[0].parts.find((p) => p.key === 'chain')).toMatchObject({ addKm: 184, nowKm: 1120 });
    const cg = compareGroups(rows, bikes, { night: { state: 'rated' }, 'day-gravel': { state: 'done' } });
    expect(cg[0]).toMatchObject({ key: 'bikepacking', n: 1, rated: 1, last: 'night' });
    expect(cg.find((x) => x.key === 'bike:b-city')).toMatchObject({ n: 0, rated: 0 });
  });
});
