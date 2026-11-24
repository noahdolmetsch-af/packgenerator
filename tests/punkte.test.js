// «Ruhige Punkte an allen Orten» (Noah 23.11.2026 «4a»): src/lib/nav/punkte.js
import { describe, it, expect } from 'vitest';
import { openTicks, toursToPack, dotsOf } from '../src/lib/nav/punkte.js';
import { flowStates, normAct } from '../src/lib/flow.js';
import { OPS } from '../src/lib/bedienung.js';

const TODAY = '2026-11-18';

describe('openTicks', () => {
  it('counts daily goals not reached today, not the resting ones', () => {
    const states = [{ resting: false, open: true }, { resting: false, open: false }, { resting: true, open: true }, { resting: false, open: true }];
    expect(openTicks(states)).toBe(2);
    expect(openTicks([])).toBe(0);
  });
  it('is the number flowStates gives for a daily activity', () => {
    const act = normAct({ id: 'a1', name: 'Yoga', ring: 'move', goals: [{ id: 'g', count: 1, days: 1 }], order: 1 });
    const open = flowStates([act], [], TODAY, []);
    expect(openTicks(open)).toBe(open.filter((s) => s.open).length);
    const done = flowStates([act], [{ id: 'e1', actId: 'a1', day: TODAY, n: 1 }], TODAY, []);
    expect(openTicks(done)).toBe(0);
  });
});

describe('toursToPack', () => {
  const trip = (over) => ({ id: 't', name: 'Jura', startDate: '2026-11-20', entries: [{ itemId: 'i1', packed: true }, { itemId: 'i2', packed: false }], ...over });
  it('a tour in 2 days with something still to pack counts', () => {
    expect(toursToPack([trip()], TODAY)).toBe(1);
  });
  it('a tour in more than 3 days does not', () => {
    expect(toursToPack([trip({ startDate: '2026-11-22' })], TODAY)).toBe(0);
    expect(toursToPack([trip({ startDate: '2026-11-21' })], TODAY)).toBe(1);
  });
  it('a full list, an empty list, a skipped or an old tour do not', () => {
    expect(toursToPack([trip({ entries: [{ itemId: 'i1', packed: true }] })], TODAY)).toBe(0);
    expect(toursToPack([trip({ entries: [] })], TODAY)).toBe(0);
    expect(toursToPack([trip({ skipped: true })], TODAY)).toBe(0);
    expect(toursToPack([trip({ startDate: '2026-11-10', days: 2 })], TODAY)).toBe(0);
  });
  it('a tour that starts today counts, one already under way does not', () => {
    expect(toursToPack([trip({ startDate: TODAY })], TODAY)).toBe(1);
    expect(toursToPack([trip({ startDate: '2026-11-17', days: 3 })], TODAY)).toBe(0);
  });
});

describe('dotsOf', () => {
  it('shows only what is waiting and switched on', () => {
    expect(dotsOf({ ticks: 3, tours: 1 })).toEqual({ week: { n: 3, tip: 'plan' }, trips: { n: 1, tip: 'tours' } });
    expect(dotsOf({ ticks: 0, tours: 0 })).toEqual({ week: null, trips: null });
    expect(dotsOf({ ticks: 3, tours: 1 }, { plan: false, trips: true }).week).toBeNull();
    expect(dotsOf({ ticks: 3, tours: 1 }, { plan: true, trips: false }).trips).toBeNull();
  });
  it('both switches exist and are on by default (a suggestion, can be switched off)', () => {
    for (const k of ['dotplan', 'dottrips']) expect(OPS.find((o) => o.key === k)?.on).toBe(true);
  });
});
