import { describe, it, expect } from 'vitest';
import { yearsWith, bikeYear, allYear } from '../src/lib/veloyear.js';

// Velo-Jahresrückblick (Noah 26.10.2026 «3a»): fictional bikes, rides and visits.
const rep = (date, km, extra = {}) => ({ date, km, action: 'replace', result: 'done', by: 'self', ...extra });
const ride = (bikeId, date, km, state = 'counted') => ({ bikeId, date, km, state, kind: 'ride' });
const bike = {
  id: 'b1',
  name: 'Test-Velo',
  parts: [
    { key: 'chain', history: [rep('2025-03-01', 0, { start: true, model: 'Alpha' }), rep('2026-04-01', 3100, { model: 'Beta', chf: 40 }), { date: '2026-05-01', km: 3300, action: 'service', result: 'done', by: 'self' }] },
    { key: 'tyres', history: [rep('2025-03-01', 0, { start: true }), rep('2026-08-01', 4200, { by: 'shop', chf: 90, visitId: 'v1' })] },
  ],
};
const visits = [{ id: 'v1', bikeId: 'b1', date: '2026-08-01', totalChf: 120 }, { id: 'v2', bikeId: 'b1', date: '2026-09-01' }, { id: 'v3', bikeId: 'b2', date: '2026-09-01', totalChf: 50 }];
const entries = [ride('b1', '2026-01-10', 40), ride('b1', '2026-06-01', 110.4), ride('b1', '2025-12-31', 60), ride('b1', '2026-02-01', 80, 'open'), ride('b2', '2026-03-01', 30)];

describe('the year of a bike', () => {
  it('sums km and rides, lists the changes with how long the old part lasted, counts services and costs', () => {
    const y = bikeYear(bike, { entries, visits, year: 2026 });
    expect(y).toMatchObject({ km: 150, rides: 2, longest: 110, services: 1, oiled: 1, visits: 2, unknown: 1 });
    expect(y.changed.map((c) => [c.key, c.date, c.lasted])).toEqual([['chain', '2026-04-01', 3100], ['tyres', '2026-08-01', 4200]]);
    // own chain 40 + visits 120 (the shop job is in the visit, not counted twice)
    expect(y.chf).toBe(160);
    expect(y.best).toMatchObject({ km: 4200 });
  });
  it('an empty year', () => {
    expect(bikeYear(bike, { entries, visits, year: 2024 })).toMatchObject({ km: 0, rides: 0, changed: [], chf: 0, best: null });
  });
  it('the years with something to show, newest first; all bikes together', () => {
    expect(yearsWith([bike], entries, visits)).toEqual(['2026', '2025']);
    const all = allYear([{ name: 'A', year: bikeYear(bike, { entries, visits, year: 2026 }) }, { name: 'B', year: bikeYear({ id: 'b2', parts: [] }, { entries, visits, year: 2026 }) }]);
    expect(all).toEqual({ km: 180, rides: 3, changed: 2, visits: 3, chf: 210, top: 'A' });
  });
});
