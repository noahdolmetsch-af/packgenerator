// S4: how sure an insight is (Sure / Tendency / Too little data). Fictional numbers only.
import { describe, it, expect } from 'vitest';
import { certaintyOf, SURE_DAYS, MIN_DAYS, look, lastDays } from '../src/lib/erkenntnisse.js';

describe('certaintyOf', () => {
  it('is sure only for a clear link on enough days', () => {
    expect(certaintyOf({ shown: true, clear: true, n: SURE_DAYS })).toBe('sure');
    expect(certaintyOf({ shown: true, clear: true, n: SURE_DAYS - 1 })).toBe('trend');
    expect(certaintyOf({ shown: true, clear: false, n: 80 })).toBe('trend');
  });
  it('says too little data for what is not shown', () => {
    expect(certaintyOf({ shown: false, clear: true, n: 90 })).toBe('few');
    expect(certaintyOf({ shown: false, n: MIN_DAYS - 1 })).toBe('few');
    expect(certaintyOf(null)).toBe('few');
  });
  it('works on a real look at a clear link', () => {
    const days = lastDays('2026-10-19', 40);
    const sleepH = Object.fromEntries(days.map((d, i) => [d, 5 + (i % 4)]));
    const battery = Object.fromEntries(days.map((d, i) => [d, 2 + (i % 4) * 2]));
    const x = look({ id: 't', x: 'sleepH', y: 'battery', lag: 0 }, { sleepH, battery }, days);
    expect(x.shown && x.clear).toBe(true);
    expect(certaintyOf(x)).toBe('sure');
    expect(certaintyOf(look({ id: 't', x: 'sleepH', y: 'battery', lag: 0 }, { sleepH, battery }, days.slice(0, 20)))).toBe('trend');
  });
});
