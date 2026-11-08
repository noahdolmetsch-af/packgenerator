// «Cardio-Belastung» Idee D: the parts of the sum behind the cardio load (lib/analyse/rechnung.js). Fictional minutes only.
import { describe, it, expect } from 'vitest';
import { loadExample, lastExample, FIXED_EXAMPLE } from '../src/lib/analyse/rechnung.js';
import { cardioLoadOf, LOAD_WEIGHTS } from '../src/lib/analyse/own.js';

describe('loadExample', () => {
  it('lists the zones with minutes, each weighted, and the total of cardioLoadOf', () => {
    const ex = loadExample({ light: 60, mod: 12, vig: 4, peak: 0 });
    expect(ex.parts).toEqual([
      { zone: 'light', min: 60, weight: 1, points: 60 },
      { zone: 'mod', min: 12, weight: 2, points: 24 },
      { zone: 'vig', min: 4, weight: 3, points: 12 },
    ]);
    expect(ex.total).toBe(96);
    expect(ex.total).toBe(cardioLoadOf({ light: 60, mod: 12, vig: 4, peak: 0 }));
  });
  it('the fixed example is 30 min light + 10 min moderate = 50 points', () => {
    expect(loadExample(FIXED_EXAMPLE).total).toBe(50);
  });
  it('is null without minutes in any zone', () => {
    expect(loadExample(null)).toBeNull();
    expect(loadExample({})).toBeNull();
    expect(loadExample({ light: 0, mod: 0 })).toBeNull();
  });
  it('the weights are the ones the page shows', () => {
    expect(LOAD_WEIGHTS).toEqual({ light: 1, mod: 2, vig: 3, peak: 4 });
  });
});

describe('lastExample', () => {
  it('takes the newest day with zone minutes', () => {
    const zones = { '2026-10-01': { light: 10 }, '2026-10-03': { mod: 5 }, '2026-10-05': null };
    const r = lastExample(['2026-10-01', '2026-10-03', '2026-10-05'], (d) => zones[d]);
    expect(r).toMatchObject({ day: '2026-10-03', total: 10 });
    expect(lastExample(['2026-10-05'], (d) => zones[d])).toBeNull();
    expect(lastExample([], () => null)).toBeNull();
  });
});
