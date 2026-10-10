// v0.78.0 «Fünf Orte» 2 / «Übergänge 2» (Noah T1–T20 a, U1–U5 a): the Touren tiles and the best values
// from the uploaded rides. Fictional data only.
import { describe, it, expect } from 'vitest';
import { routeOf, routePath, bestValues, kindOf, periodFrom, hmm, KINDS, PERIODS } from '../src/lib/tripsboard.js';

const line = [[47.0, 8.0], [47.01, 8.02], [47.02, 8.0], [47.0, 8.0]];
const trip = (id, startDate, days = 1, extra = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days, ...extra });
const ride = (id, tripId, date, km, gainM, movingH, totalH, pauses = 0) => ({ id, tripId, date, km, gainM, movingH, totalH, pauses: Array.from({ length: pauses }, () => ({ min: 10 })), line });

describe('the route of a tile', () => {
  it('takes the GPX of the trip, else its first ride, else none', () => {
    expect(routeOf(trip('a', '2026-09-01', 1, { route: { line, km: 40, gainM: 500 } }), [])).toEqual({ line, km: 40, gainM: 500 });
    expect(routeOf(trip('b', '2026-09-01'), [ride('r1', 'b', '2026-09-01', 30, 200, 2, 3)])).toEqual({ line, km: 30, gainM: 200 });
    expect(routeOf(trip('c', '2026-09-01'), [])).toBe(null);
  });

  it('draws the line inside the box, north up, and ends at the last point', () => {
    const p = routePath(line, 260, 128);
    expect(p.d.startsWith('M')).toBe(true);
    const nums = p.d.match(/-?\d+(\.\d+)?/g).map(Number);
    for (let i = 0; i < nums.length; i += 2) {
      expect(nums[i]).toBeGreaterThanOrEqual(0);
      expect(nums[i]).toBeLessThanOrEqual(260);
      expect(nums[i + 1]).toBeGreaterThanOrEqual(0);
      expect(nums[i + 1]).toBeLessThanOrEqual(128);
    }
    // the second point lies further north than the first: smaller y
    expect(nums[3]).toBeLessThan(nums[1]);
    expect(p.end).toEqual([nums.at(-2), nums.at(-1)]);
    expect(routePath([[47, 8]])).toBe(null);
  });
});

describe('best values and averages', () => {
  const today = '2026-10-10';
  const trips = [trip('day', '2026-08-01', 1), trip('one', '2026-09-05', 2), trip('three', '2026-09-20', 3), trip('old', '2025-07-01', 1), trip('ahead', '2026-10-20', 1)];
  const rides = [
    ride('r1', 'day', '2026-08-01', 60, 800, 3, 4, 2),
    ride('r2', 'one', '2026-09-05', 70, 900, 4, 5, 1),
    ride('r3', 'one', '2026-09-06', 55, 700, 3.5, 4.5, 3),
    ride('r4', 'three', '2026-09-20', 92, 1500, 6.8, 9.5, 2),
    ride('r5', 'three', '2026-09-21', 40, 400, 2, 3),
    ride('r6', 'three', '2026-09-22', 50, 600, 3, 4),
    ride('r7', 'old', '2025-07-01', 150, 2500, 8, 10),
  ];

  it('this season: the longest trip, most climbing, longest day and furthest day', () => {
    const b = bestValues({ trips, rides, today, period: 'season' });
    expect(b.longest).toEqual({ km: 182, title: 'test_data_gtp_ three', days: 3 });
    expect(b.climb).toEqual({ m: 2500, title: 'test_data_gtp_ three' });
    expect(b.time).toEqual({ h: 6.8, totalH: 9.5, title: 'test_data_gtp_ three' });
    expect(b.furthest).toEqual({ km: 92, title: 'test_data_gtp_ three' });
    expect(b.any).toBe(true);
  });

  it('the average per kind of trip adds up the rides of each trip', () => {
    const b = bestValues({ trips, rides, today, period: 'season' });
    expect(b.avg.map((a) => a.key)).toEqual(KINDS.map((k) => k.key));
    expect(b.avg.find((a) => a.key === 'overnighter')).toMatchObject({ n: 1, km: 125, gainM: 1600, movingH: 7.5, totalH: 9.5, stops: 4 });
    expect(b.avg.find((a) => a.key === 'day')).toMatchObject({ n: 1, km: 60, stops: 2 });
  });

  it('all: older rides count too; a trip ahead never counts', () => {
    const b = bestValues({ trips, rides: [...rides, ride('r8', 'ahead', '2026-10-20', 300, 1, 1, 1)], today, period: 'all' });
    expect(b.furthest).toEqual({ km: 150, title: 'test_data_gtp_ old' });
    expect(b.longest.km).toBe(182);
  });

  it('without rides nothing is made up', () => {
    const b = bestValues({ trips, rides: [], today, period: 'season' });
    expect([b.longest, b.climb, b.time, b.furthest, b.any]).toEqual([null, null, null, null, false]);
    expect(b.avg.every((a) => a.n === 0)).toBe(true);
  });
});

describe('small helpers', () => {
  it('kinds, periods and hours', () => {
    expect([kindOf({ days: 1 }), kindOf({ days: 2 }), kindOf({ days: 4 }), kindOf({})]).toEqual(['day', 'overnighter', 'multi', 'day']);
    expect(PERIODS.map((p) => p.key)).toEqual(['season', 'year', 'all']);
    expect(periodFrom('season', '2026-10-10')).toBe('2026-01-01');
    expect(periodFrom('year', '2026-10-10')).toBe('2025-10-10');
    expect(periodFrom('all', '2026-10-10')).toBe('');
    expect([hmm(6.8), hmm(0.25), hmm(null)]).toEqual(['6:48', '0:15', '–']);
  });
});
