// Etappe 2, Design a: a message that shows up after a tap is brought into view (src/lib/nav/alertseen.js).
import { describe, it, expect } from 'vitest';
import { outOfSight, alertsIn, SINCE_TAP_MS } from '../src/lib/nav/alertseen.js';

describe('outOfSight', () => {
  it('a message fully on the screen stays', () => expect(outOfSight({ top: 100, bottom: 140, width: 300, height: 40 }, 800)).toBe(false));
  it('above the screen, below it or cut off counts as out of sight', () => {
    expect(outOfSight({ top: -300, bottom: -260, width: 300, height: 40 }, 800)).toBe(true);
    expect(outOfSight({ top: 900, bottom: 940, width: 300, height: 40 }, 800)).toBe(true);
    expect(outOfSight({ top: 780, bottom: 820, width: 300, height: 40 }, 800)).toBe(true);
    expect(outOfSight({ top: -10, bottom: 30, width: 300, height: 40 }, 800)).toBe(true);
  });
  it('a box with no size is not on the screen: leave it', () => {
    expect(outOfSight({ top: 0, bottom: 0, width: 0, height: 0 }, 800)).toBe(false);
    expect(outOfSight(null, 800)).toBe(false);
  });
});

describe('alertsIn', () => {
  const el = (alert, kids = []) => ({ nodeType: 1, matches: () => alert, querySelectorAll: () => kids });
  it('finds the node itself and what it holds', () => {
    const child = el(true);
    expect(alertsIn(el(true, [child]))).toHaveLength(2);
    expect(alertsIn(el(false, [child]))).toEqual([child]);
  });
  it('ignores text and nothing', () => {
    expect(alertsIn({ nodeType: 3 })).toEqual([]);
    expect(alertsIn(null)).toEqual([]);
  });
});

it('a tap counts for a few seconds', () => expect(SINCE_TAP_MS).toBeGreaterThanOrEqual(3000));
