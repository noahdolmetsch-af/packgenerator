// UI-Ziele I2 / #17 (Noah 20.10.2026 «freigabe für alles»): the goal chips under the greeting. Lists come from the source.
import { describe, it, expect } from 'vitest';
import { GOALS, goalsOf, goalsRecord, moveGoal, toggleGoal } from '../src/lib/home/goals.js';
import DE from '../src/lib/i18n/de/index.js';

const keys = (l) => l.map((g) => g.key);
const on = (l) => l.filter((g) => g.on).map((g) => g.key);

describe('goal chips', () => {
  it('the ready chips: the countdown, ride today, plan a trip, work on the bike, plan the week', () => {
    expect(on(goalsOf(null))).toEqual(['count', 'ride', 'trip', 'care', 'week']);
    expect(keys(goalsOf(undefined))).toEqual(keys(GOALS));
  });
  it('moved and switched off they stay so; unknown keys go, a later chip starts as it comes, in its ready place', () => {
    let l = goalsOf(null);
    l = moveGoal(l, 4, 1);
    l = toggleGoal(l, 'trip');
    l = toggleGoal(l, 'diary');
    const back = goalsOf(goalsRecord(l));
    expect(keys(back).slice(0, 3)).toEqual(['count', 'week', 'ride']);
    expect(on(back)).toEqual(['count', 'week', 'ride', 'care', 'diary']);
    expect(keys(goalsOf({ order: ['nope', 'care', 'care'], off: [] }))[0]).toBe('count');
    // a wall of 0.169 (without the countdown) gets it once, on top, and on
    expect(goalsOf({ order: ['week', 'ride', 'trip', 'care', 'diary'], off: ['trip'] }).map((g) => [g.key, g.on]).slice(0, 2)).toEqual([['count', true], ['week', true]]);
    expect(goalsOf({ order: ['care'], off: [] }).find((g) => g.key === 'diary').on).toBe(false);
    expect(moveGoal(l, 0, 99)).toBe(l);
  });
  it('every chip is German', () => {
    for (const g of GOALS) expect(DE[g.label], g.label).toBeTruthy();
  });
});
