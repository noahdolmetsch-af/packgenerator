// «Cardio-Belastung» Idee A: the trips of the shown days as a list with the mean of the value (lib/analyse/tourliste.js). Fictional days only.
import { describe, it, expect } from 'vitest';
import { tripRows, tripPageHref } from '../src/lib/analyse/tourliste.js';
import { windowOf } from '../src/lib/analyse/detail.js';
import { tripEnd } from '../src/lib/tripstate.js';

const T = '2026-10-09';
const days = windowOf('m3', T).days;
const val = { '2026-09-12': 1000, '2026-09-13': 2000, '2026-09-14': 1500, '2026-10-03': 900 };
const get = (d) => val[d] ?? null;
const trips = [
  { id: 'a', title: 'Alpenrunde', startDate: '2026-09-12', days: 3 },
  { id: 'b', name: 'Seetal', startDate: '2026-10-03', days: 1 },
  { id: 'c', title: 'Zu alt', startDate: '2026-01-01', days: 2 },
  { id: 'd', title: 'Morgen', startDate: '2026-10-10', days: 2 },
];

describe('tripRows', () => {
  it('lists the trips of the days, newest first, with the mean over their days', () => {
    const r = tripRows(trips, days, tripEnd, get, T);
    expect(r.map((x) => x.name)).toEqual(['Seetal', 'Alpenrunde']);
    expect(r[1]).toMatchObject({ from: '2026-09-12', to: '2026-09-14', n: 3, avg: 1500 });
    expect(r[0]).toMatchObject({ n: 1, avg: 900 });
  });
  it('a trip without a value has no mean', () => {
    const r = tripRows(trips, days, tripEnd, () => null, T);
    expect(r.every((x) => x.avg === null && x.n === 0)).toBe(true);
  });
  it('links only trips that are over', () => {
    const future = [{ id: 'd', title: 'Heute', startDate: T, days: 1 }];
    expect(tripRows(future, days, tripEnd, get, T)[0].href).toBeNull();
    expect(tripRows(trips, days, tripEnd, get, T)[1].href).toBe(tripPageHref('a'));
    expect(tripPageHref('a b')).toBe('#/tour/t%3Aa%20b');
  });
  it('clips a trip to the shown days and ignores empty input', () => {
    const w = windowOf('w', T).days; // 03.–09. Oct.
    const r = tripRows([{ id: 'x', title: 'Lang', startDate: '2026-09-30', days: 6 }], w, tripEnd, get, T);
    expect(r[0]).toMatchObject({ from: '2026-10-03', to: '2026-10-05', n: 1, avg: 900 });
    expect(tripRows([], days, tripEnd, get, T)).toEqual([]);
    expect(tripRows(trips, [], tripEnd, get, T)).toEqual([]);
  });
});
