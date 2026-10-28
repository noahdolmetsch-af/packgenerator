// «Diagramme zum Antippen» K4 (Noah 27.10.2026 «1-5 a»): the days of the Tour-Bereitschaft, counted from the
// tour's first day, and the tours in a span. Fictional data only.
import { describe, it, expect } from 'vitest';
import { BEFORE, spanOf, tourDays, relAxis, atRel, relText, tripsIn } from '../src/lib/flow/form/tourtage.js';

const table = new Map([
  ['2026-10-01', { rhr: 50, sleep: 420 }],
  ['2026-10-07', { rhr: 52 }],
  ['2026-10-08', { rhr: 55 }],
  ['2026-10-09', { rhr: 57 }],
]);

describe('Tour-Bereitschaft: days from the tour start', () => {
  it('a trip: first day and length', () => {
    expect(spanOf({ startDate: '2026-10-08T00:00:00Z', days: 3 })).toEqual({ s: '2026-10-08', n: 3 });
    expect(spanOf({ startDate: '2026-10-08' }).n).toBe(1);
  });
  it('7 days before, then day 1 … n; no day 0', () => {
    const d = tourDays({ startDate: '2026-10-08', days: 3 }, table, '2026-10-20');
    expect(d).toHaveLength(BEFORE + 3);
    expect(d.map((x) => x.rel)).toEqual([-7, -6, -5, -4, -3, -2, -1, 1, 2, 3]);
    expect(d[0]).toMatchObject({ day: '2026-10-01', rhr: 50, sleep: 420, inTour: false });
    expect(atRel(d, 1)).toBe(55);
    expect(atRel(d, 3)).toBeNull();
  });
  it('days after today stay open, never 0', () => {
    const d = tourDays({ startDate: '2026-10-08', days: 3 }, table, '2026-10-08');
    expect(d.find((x) => x.rel === 2)).toMatchObject({ future: true, rhr: null });
    expect(d.find((x) => x.rel === 1)).toMatchObject({ future: false, rhr: 55 });
  });
  it('one axis for tours of different length', () => {
    const a = tourDays({ startDate: '2026-10-08', days: 2 }, table, '2026-10-20');
    const b = tourDays({ startDate: '2026-09-01', days: 4 }, table, '2026-10-20');
    expect(relAxis([a, b])).toEqual([-7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4]);
    expect(relText(-3)).toBe('−3');
    expect(relText(2)).toBe('2');
  });
  it('the tours that touch a span, skipped and idea trips left out', () => {
    const trips = [
      { id: 'a', startDate: '2026-09-28', days: 5 },
      { id: 'b', startDate: '2026-10-15', days: 2, skipped: true },
      { id: 'c', startDate: '2026-11-01', days: 2 },
      { id: 'd', startDate: '2026-10-10', days: 1, idea: true },
    ];
    expect(tripsIn(trips, '2026-10-01', '2026-10-31').map((x) => [x.trip.id, x.s, x.e])).toEqual([['a', '2026-09-28', '2026-10-02']]);
  });
});
