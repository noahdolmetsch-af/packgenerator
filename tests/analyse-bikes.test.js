import { describe, it, expect } from 'vitest';
import { bikeWeeks, bikeTotals } from '../src/lib/analyse/bikes.js';

const e = (bikeId, date, km, extra = {}) => ({ bikeId, date, km, kind: 'ride', state: 'counted', ...extra });

describe('analyse bike km', () => {
  it('km per week per bike, only counted rides up to today', () => {
    const entries = [e('a', '2026-10-26', 40), e('a', '2026-10-27', 10), e('b', '2026-10-20', 25), e('a', '2026-10-27', 99, { state: 'draft' }), e('a', '2026-10-27', 5, { kind: 'fix' }), e('a', '2026-10-28', 7)];
    const w = bikeWeeks(entries, ['a', 'b'], '2026-10-27', 2);
    expect(w.map((x) => x.key)).toEqual(['2026-10-19', '2026-10-26']);
    expect(w[1].km).toEqual({ a: 50, b: 0 });
    expect(w[0].km.b).toBe(25);
  });
  it('totals in the period, most first', () => {
    const bikes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const t = bikeTotals([e('a', '2026-10-01', 10), e('b', '2026-10-02', 30), e('b', '2026-09-01', 30)], bikes, ['2026-10-01', '2026-10-02']);
    expect(t.map((x) => [x.bike.id, x.km])).toEqual([['b', 30], ['a', 10]]);
  });
});
