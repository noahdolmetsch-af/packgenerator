import { describe, it, expect } from 'vitest';
import { ruleFor, ruleSuggestions } from '../src/lib/faustregel.js';

// «Faustregeln» (D2): fictional trips; facts as tripFacts makes them (here only wx.min and rain).
const row = (minC, used, extra = {}) => ({ facts: { minC, maxC: minC + 8, rainPct: 10, gainM: 500, hours: 5, ...extra }, used });

describe('ruleFor', () => {
  it('finds a clean cold split', () => {
    const r = ruleFor([row(2, true), row(5, true), row(12, false), row(15, false)]);
    expect(r).toMatchObject({ metric: 'minC', cmp: 'lt', used: 2, unused: 2, n: 4 });
    expect(r.limit).toBeGreaterThan(5);
    expect(r.limit).toBeLessThanOrEqual(12);
  });
  it('a warm block: used from a limit on', () => {
    const r = ruleFor([row(18, true), row(22, true), row(6, false), row(9, false)]);
    expect(r).toMatchObject({ metric: 'minC', cmp: 'gte' });
  });
  it('needs enough trips and both outcomes', () => {
    expect(ruleFor([row(2, true), row(12, false), row(3, true)])).toBe(null);
    expect(ruleFor([row(2, true), row(3, true), row(4, true), row(5, true)])).toBe(null);
  });
  it('no split when the groups mix', () => {
    expect(ruleFor([row(2, true, { rainPct: 50 }), row(5, false, { rainPct: 50 }), row(12, true, { rainPct: 50 }), row(15, false, { rainPct: 50 })])).toBe(null);
  });
});

describe('ruleSuggestions', () => {
  const sets = [{ key: 'u-warmup', name: 'Wärmer' }];
  const items = [{ id: 'i1', name: 'Jacke', sets: ['u-warmup'], ownership: 'owned', category: 'rain' }];
  const trip = (id, min) => ({ id, title: id, startDate: `2026-0${id.slice(1)}-10`, wx: { min, max: min + 8, rain: 'none' }, days: 1, entries: [{ itemId: 'i1' }] });
  const trips = [trip('t1', 2), trip('t2', 4), trip('t3', 12), trip('t4', 16)];
  const debriefs = [['t1', 'ok'], ['t2', 'ok'], ['t3', 'unused'], ['t4', 'unused']].map(([tripId, st]) => ({ tripId, status: 'done', items: { i1: st } }));
  it('suggests a rule for an own block', () => {
    const s = ruleSuggestions({ trips, debriefs, items, setsValue: sets });
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ key: 'u-warmup', rule: { metric: 'minC', cmp: 'lt' }, used: 2, unused: 2, parts: ['Jacke'] });
  });
  it('leaves out a dismissed one and a block that has a rule', () => {
    expect(ruleSuggestions({ trips, debriefs, items, setsValue: sets, dismissed: ['u-warmup:minC'] })).toEqual([]);
    expect(ruleSuggestions({ trips, debriefs, items, setsValue: [{ ...sets[0], rule: { on: true, metric: 'minC', cmp: 'lt', limit: 5 } }] })).toEqual([]);
  });
});
