// SN4+ «SN4 plus» (mockups SN4e and SN4f-a approved 13.10.2026: 1a, 2 «Wetter und Temperatur immer an, plus
// Max. Puls», 3b, 4a, 5a): the columns of «Vergangene Touren» and the 10 blocks of «In Zahlen».
// Fictional rows only (test_data_gtp_).
import { describe, it, expect } from 'vitest';
import { COLS, COL_KEYS, COL_GROUPS, viewOf, shownCols, toggled, rowValues, commentOf, BLOCKS, GROUPS, monthsOf, monthSums, bestValues, lastYear, whenBuckets, hourIn, partOf, routeMap, routesOn, levelOf, perBike, packStats, zoneMonths, weatherSum, footprint, CO2_PER_KM } from '../src/lib/review/inzahlen.js';
import { actOf } from '../src/lib/review/actdata.js';

const P = 'test_data_gtp_';
/** A row like rueckblick.js tripFacts() gives. */
function row({ id, start, days = 1, km = null, gainM = null, movingH = null, totalH = null, kmh = null, rides = [], bikeId = 'b1', wet = null, tmin = null, tmax = null, art = 'day', kind = 'trip', entries = [], line = null }) {
  const end = new Date(Date.parse(`${start}T12:00:00Z`) + (days - 1) * 864e5).toISOString().slice(0, 10);
  return {
    id: `${P}${id}`, kind, title: `${P}${id}`, start, end, days, art, km, gainM, movingH, totalH, kmh, rides, rain: { wet, days: wet ? [1] : [] }, tmin, tmax, learnings: [],
    trip: kind === 'trip' ? { id: `${P}${id}`, startDate: start, days, bikeId, entries, route: line ? { line } : {} } : null,
  };
}

describe('SN4e: the columns', () => {
  it('all columns on at first (answer 2: Wetter, Temperatur and Max. Puls too), Tour and Zustand are not choosable', () => {
    const v = viewOf(null);
    expect(v.hide).toEqual([]);
    expect(shownCols(v).map((c) => c.key)).toEqual(COL_KEYS);
    expect(COL_KEYS).toEqual(['km', 'gainM', 'moving', 'elapsed', 'kmh', 'hrAvg', 'hrMax', 'type', 'wx', 'temp', 'comment']);
    expect(COL_GROUPS.flatMap((g) => g.keys).sort()).toEqual([...COL_KEYS].sort());
    expect(COLS.some((c) => c.key === 'trip' || c.key === 'state')).toBe(false);
  });
  it('a column switched off stays off, unknown keys are dropped, reset is an empty list', () => {
    const v = viewOf({ hide: ['wx', 'nope'], open: ['body'] });
    expect(v.hide).toEqual(['wx']);
    expect(v.open).toEqual(['body']);
    expect(shownCols(v).map((c) => c.key)).not.toContain('wx');
    expect(toggled(['wx'], 'wx')).toEqual([]);
    expect(toggled([], 'temp')).toEqual(['temp']);
    expect(viewOf({ hide: [] }).open).toEqual(['dist']); // only the first group open at first
  });
  it('without activities: times from the uploaded rides, heart rate from the ride ledger, the bike type, comment «–»', () => {
    const r = row({ id: 'napf', start: '2026-10-06', km: 62, gainM: 1180, movingH: 3.08, totalH: 3.87, kmh: 20.1, rides: [{ km: 62, startAt: '2026-10-06T05:30:00.000Z' }] });
    const entries = [{ source: 'strava', kind: 'ride', state: 'counted', date: '2026-10-06', km: 62, bikeId: 'b1', hrAvg: 138, hrMax: 176, time: '2026-10-06T05:30:00Z' }];
    const v = rowValues(r, { acts: [], entries, bikes: [{ id: 'b1', name: 'Rennvelo Blau', type: 'road' }] });
    expect(v).toMatchObject({ gainM: 1180, movingS: Math.round(3.08 * 3600), elapsedS: Math.round(3.87 * 3600), kmh: 20.1, hrAvg: 138, hrMax: 176, type: 'road', startAt: '2026-10-06T05:30:00.000Z' });
    expect(v.comment.state).toBe('none');
  });
  it('with activities: moving and elapsed time, Ø km/h = km over moving time, the comment', () => {
    const r = row({ id: 'x', start: '2026-09-23', km: 74 });
    const acts = [actOf({ id: 1, day: '2026-09-23', km: 74, movingS: 3.74 * 3600, elapsedS: 4.5 * 3600, hrAvg: 135, hrMax: 171, desc: 'Ruhig, kein Wind.' })];
    const v = rowValues(r, { acts, entries: [], bikes: [] });
    expect(v.movingS).toBe(Math.round(3.74 * 3600 * 1000) / 1000);
    expect(v.elapsedS).toBe(4.5 * 3600);
    expect(v.kmh).toBe(Math.round((74 / 3.74) * 10) / 10);
    expect(v.hrAvg).toBe(135);
    expect(v.comment).toMatchObject({ state: 'text', text: 'Ruhig, kein Wind.' });
    expect(v.type).toBe(null);
  });
  it('the comment: «Kommentar laden» when not loaded, «–» when empty or without Strava', () => {
    expect(commentOf([]).state).toBe('none');
    expect(commentOf([actOf({ id: 1, day: '2026-08-10' })])).toMatchObject({ state: 'load', ids: [1] });
    expect(commentOf([actOf({ id: 2, day: '2026-08-10', desc: '' })]).state).toBe('empty');
    expect(commentOf([actOf({ id: 3, day: '2026-08-10', desc: null })]).state).toBe('empty');
    expect(commentOf([actOf({ id: 4, desc: 'Tag 1' }), actOf({ id: 5 })])).toMatchObject({ state: 'text', text: 'Tag 1', ids: [5] });
  });
});

describe('SN4f-a: the groups and blocks', () => {
  it('10 blocks in 4 groups (answer 1a)', () => {
    expect(BLOCKS).toHaveLength(10);
    expect(GROUPS.map((g) => g.key)).toEqual(['dist', 'bikes', 'body', 'records']);
    const by = (g) => BLOCKS.filter((b) => b.group === g).map((b) => b.key);
    expect(by('dist')).toEqual(['V1', 'V7', 'V10']);
    expect(by('bikes')).toEqual(['V3', 'V12']);
    expect(by('body')).toEqual(['V8']);
    expect(by('records')).toEqual(['V2', 'V6', 'V9', 'V11']);
  });

  it('V1: km and Hm per month, 12 months up to today, a trip counts in its start month', () => {
    const today = '2026-10-09';
    const months = monthsOf('12m', today);
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2025-11');
    expect(months.at(-1)).toBe('2026-10');
    expect(monthsOf('year', today)).toHaveLength(10);
    const rows = [row({ id: 'a', start: '2026-10-06', km: 62, gainM: 1180 }), row({ id: 'b', start: '2026-10-04', km: 41, gainM: 520 }), row({ id: 'c', start: '2026-09-30', days: 2, km: 110, gainM: 1640 }), row({ id: 'd', start: '2026-03-23', km: 90, gainM: null })];
    const sums = monthSums(rows, months);
    expect(sums.find((m) => m.ym === '2026-10')).toEqual({ ym: '2026-10', n: 2, km: 103, gainM: 1700 });
    expect(sums.find((m) => m.ym === '2026-09')).toMatchObject({ km: 110, gainM: 1640 });
    expect(sums.find((m) => m.ym === '2026-03')).toMatchObject({ km: 90, gainM: 0 });
    expect(sums.find((m) => m.ym === '2026-01')).toMatchObject({ n: 0, km: 0 });
    expect(monthsOf('all', today, rows)[0]).toBe('2026-03');
  });

  it('V2: longest ride (one day of a trip), most Hm, fastest Ø, longest trip', () => {
    const rows = [
      row({ id: 'chasseral', start: '2026-09-30', days: 2, km: 110, gainM: 1640, kmh: 17.4, rides: [{ km: 70 }, { km: 40 }] }),
      row({ id: 'napf', start: '2026-10-06', km: 62, gainM: 1180, kmh: 20.1, rides: [{ km: 62 }] }),
      row({ id: 'rigi', start: '2026-03-23', km: 90, gainM: 1010, kmh: 19.9 }),
    ];
    const b = bestValues(rows);
    expect(b.ride).toEqual({ value: 90, title: `${P}rigi`, id: `${P}rigi` });
    expect(b.gain).toMatchObject({ value: 1640, id: `${P}chasseral` });
    expect(b.speed).toMatchObject({ value: 20.1, id: `${P}napf` });
    expect(b.trip).toMatchObject({ value: 2, id: `${P}chasseral` });
    expect(bestValues([])).toEqual({ ride: null, gain: null, speed: null, trip: null });
  });

  it('V6 (answer 4a): 1 January up to today against last year up to the same date', () => {
    const facts = [
      row({ id: 'n1', start: '2026-10-06', km: 62, gainM: 1180, movingH: 3 }),
      row({ id: 'n2', start: '2026-01-01', km: 40, gainM: 300, movingH: 2 }),
      row({ id: 'late', start: '2026-10-10', km: 99 }), // after today: not counted
      row({ id: 'o1', start: '2025-10-09', km: 50, gainM: 500, movingH: 2.5 }), // the same date last year: counted
      row({ id: 'o2', start: '2025-10-10', km: 70, gainM: 900, movingH: 4 }), // after it: not counted
      row({ id: 'o3', start: '2024-12-31', km: 30 }), // the year before: not counted
    ];
    const ly = lastYear(facts, '2026-10-09');
    expect(ly).toMatchObject({ year: 2026, prevYear: 2025, to: '2026-10-09', prevTo: '2025-10-09' });
    const get = (k) => ly.rows.find((x) => x.key === k);
    expect(get('trips')).toEqual({ key: 'trips', cur: 2, prev: 1, diff: 1 });
    expect(get('km')).toEqual({ key: 'km', cur: 102, prev: 50, diff: 52 });
    expect(get('gainM')).toMatchObject({ cur: 1480, prev: 500, diff: 980 });
    expect(get('movingH')).toMatchObject({ cur: 5, prev: 2.5, diff: 2.5 });
  });

  it('answer 5a: the blocks follow the rows (filters), V6 always reads all trips', () => {
    const facts = [row({ id: 'day', start: '2026-10-06', km: 62, art: 'day' }), row({ id: 'multi', start: '2026-09-30', days: 2, km: 110, art: 'multi' }), row({ id: 'old', start: '2025-09-01', km: 80, art: 'day' })];
    const filtered = facts.filter((r) => r.art === 'multi');
    const months = monthsOf('12m', '2026-10-09');
    expect(monthSums(filtered, months).reduce((s, m) => s + m.km, 0)).toBe(110);
    expect(monthSums(facts, months).reduce((s, m) => s + m.km, 0)).toBe(172);
    expect(footprint(filtered).km).toBe(110);
    // V6 is computed from all facts on the page, so the filter does not change it
    expect(lastYear(facts, '2026-10-09')).toEqual(lastYear([...facts], '2026-10-09'));
    expect(lastYear(facts, '2026-10-09').rows.find((x) => x.key === 'km')).toMatchObject({ cur: 172, prev: 80 });
  });

  it('V10: weekdays Monday first, morning / afternoon / evening on the Zurich clock', () => {
    expect(hourIn('2026-10-06T05:30:00.000Z')).toBe(7); // summer time: UTC+2
    expect(hourIn('2026-12-06T16:30:00.000Z')).toBe(17); // winter time: UTC+1
    expect(hourIn(null)).toBe(null);
    expect([partOf(11), partOf(12), partOf(16), partOf(17), partOf(null)]).toEqual(['morning', 'afternoon', 'afternoon', 'evening', null]);
    const rows = [row({ id: 'mo', start: '2026-10-05' }), row({ id: 'mi', start: '2026-10-07' }), row({ id: 'mi2', start: '2026-09-30' }), row({ id: 'so', start: '2026-10-04' })];
    const w = whenBuckets(rows, { [`${P}mo`]: '2026-10-05T05:00:00Z', [`${P}mi`]: '2026-10-07T11:00:00Z', [`${P}mi2`]: '2026-09-30T16:00:00Z', [`${P}so`]: null });
    expect(w.days).toEqual([1, 0, 2, 0, 0, 0, 1]);
    expect(w.parts).toEqual({ morning: 1, afternoon: 1, evening: 1 });
    expect(w.without).toEqual([`${P}so`]);
  });

  it('V7: a stretch ridden by several trips counts per trip; 1× / 2–3× / 4× and more', () => {
    const shared = [[47.3, 8.5], [47.31, 8.52], [47.32, 8.54]];
    const rows = [
      row({ id: 'a', start: '2026-10-01', line: [...shared, [47.35, 8.6]] }),
      row({ id: 'b', start: '2026-10-02', rides: [{ line: [...shared, [47.28, 8.6]] }] }),
      row({ id: 'c', start: '2026-10-03', line: [[46.9, 8.0], [46.95, 8.1]] }),
      row({ id: 'none', start: '2026-10-04' }),
    ];
    const m = routeMap(rows);
    expect(m.routes.map((r) => r.id)).toEqual([`${P}a`, `${P}b`, `${P}c`]);
    const a = m.routes[0];
    expect(a.segs.slice(0, 2).map((g) => g.n)).toEqual([2, 2]);
    expect(a.segs[2].n).toBe(1);
    expect(m.routes[2].segs[0].n).toBe(1);
    expect(routesOn(m, a.segs[0].key)).toEqual([`${P}a`, `${P}b`]);
    expect(m.box).toEqual({ s: 46.9, w: 8.0, n: 47.35, e: 8.6 });
    expect([levelOf(1), levelOf(2), levelOf(3), levelOf(4), levelOf(9)]).toEqual([1, 2, 2, 3, 3]);
    // the same trip riding a stretch twice still counts once
    const twice = routeMap([row({ id: 'loop', start: '2026-10-01', rides: [{ line: shared }, { line: shared }] })]);
    expect(twice.routes[0].segs.every((g) => g.n === 1)).toBe(true);
    expect(routeMap([])).toEqual({ routes: [], box: null });
  });

  it('V3: per bike trips, km and hours, most km first', () => {
    const rows = [row({ id: 'a', start: '2026-10-01', km: 60, movingH: 3, bikeId: 'g' }), row({ id: 'b', start: '2026-10-02', km: 40, movingH: 2, bikeId: 'g' }), row({ id: 'c', start: '2026-10-03', km: 55, movingH: 2.5, bikeId: 'r' }), row({ id: 'd', start: '2026-10-04', km: 10, bikeId: null })];
    const x = perBike(rows, [{ id: 'g', name: 'Gravel Grau', type: 'gravel' }, { id: 'r', name: 'Rennvelo Blau' }]);
    expect(x.map((b) => [b.name, b.n, b.km, b.h])).toEqual([['Gravel Grau', 2, 100, 5], ['Rennvelo Blau', 1, 55, 2.5]]);
    expect(x[0].share).toBeCloseTo(100 / 155);
  });

  it('V12: Ø base weight per trip, day and multi-day, the items packed most', () => {
    const items = [{ id: 'i1', name: 'Pump', weightG: 100 }, { id: 'i2', name: 'Tube', weightG: 200 }, { id: 'i3', name: 'Tent', weightG: 1200 }];
    const e = (itemId) => ({ itemId, slot: 'seat', qty: 1, packed: true });
    const rows = [row({ id: 'a', start: '2026-10-01', entries: [e('i1'), e('i2')] }), row({ id: 'b', start: '2026-10-02', days: 2, entries: [e('i1'), e('i3')] }), row({ id: 'c', start: '2026-10-03' })];
    rows.forEach((r) => (r.trip.setup = { seat: 'bag1' }));
    const p = packStats(rows, items, [], []);
    expect(p).toMatchObject({ n: 2, dayG: 300, multiG: 1300, avgG: 800 });
    expect(p.top.map((x) => [x.id, x.n])).toEqual([['i1', 2], ['i3', 1], ['i2', 1]]);
    expect(packStats([], items).n).toBe(0);
  });

  it('V8: seconds in the zones per month', () => {
    const rows = [row({ id: 'a', start: '2026-10-01' }), row({ id: 'b', start: '2026-10-05' }), row({ id: 'c', start: '2026-09-05' })];
    const z = zoneMonths(rows, ['2026-09', '2026-10'], { [`${P}a`]: [60, 120, 0, 0, 0], [`${P}b`]: [0, 60, 30, 0, 0], [`${P}c`]: null });
    expect(z).toEqual([{ ym: '2026-09', zones: null, zoneS: 0 }, { ym: '2026-10', zones: [60, 180, 30, 0, 0], zoneS: 270 }]);
  });

  it('V9 and V11: rain, the coldest and the warmest day; kg CO₂ at 0.15 per car km, trips without a bike do not count', () => {
    const rows = [row({ id: 'a', start: '2026-10-01', wet: true, tmin: 9, tmax: 17, km: 40 }), row({ id: 'b', start: '2026-03-01', wet: false, tmin: 4, tmax: 11, km: 60 }), row({ id: 'c', start: '2026-07-01', km: 100, art: 'other' })];
    expect(weatherSum(rows)).toEqual({ known: 2, wet: 1, cold: { value: 4, title: `${P}b`, id: `${P}b` }, hot: { value: 17, title: `${P}a`, id: `${P}a` } });
    expect(CO2_PER_KM).toBe(0.15);
    expect(footprint(rows)).toEqual({ km: 100, kg: 15 });
    expect(weatherSum([])).toEqual({ known: 0, wet: 0, cold: null, hot: null });
  });
});
