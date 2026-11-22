// UI-Ziele I2 / #17 (Noah 20.10.2026 «freigabe für alles»): the goal chips under the greeting. Lists come from the source.
import { describe, it, expect } from 'vitest';
import { GOALS, goalsOf, goalsRecord, moveGoal, toggleGoal } from '../src/lib/home/goals.js';
import DE from '../src/lib/i18n/de/index.js';

const keys = (l) => l.map((g) => g.key);
const on = (l) => l.filter((g) => g.on).map((g) => g.key);

describe('goal chips', () => {
  it('the ready chips: the countdown and «Ride today» and «Tick off» (Noah 22.11.2026 «ja») are on (the Wächter heimat wants every function on its home page); the other chips are one switch away', () => {
    expect(on(goalsOf(null))).toEqual(['count', 'ride', 'tick']);
    expect(keys(goalsOf(null))).toEqual(['count', 'ride', 'tick', 'trip', 'care', 'week', 'diary']);
    expect(keys(goalsOf(undefined))).toEqual(keys(GOALS));
  });
  it('moved and switched off they stay so; unknown keys go, a later chip starts as it comes, in its ready place', () => {
    let l = goalsOf(null).map((g) => ({ ...g, on: g.key !== 'diary' }));
    l = moveGoal(l, 5, 1);
    l = toggleGoal(l, 'trip');
    l = toggleGoal(l, 'diary');
    const back = goalsOf(goalsRecord(l));
    expect(keys(back).slice(0, 3)).toEqual(['count', 'week', 'ride']);
    expect(on(back)).toEqual(['count', 'week', 'ride', 'tick', 'care', 'diary']);
    expect(keys(goalsOf({ order: ['nope', 'care', 'care'], off: [] }))[0]).toBe('count');
    // a wall of 0.169 (without the countdown) gets it once, on top, and on
    expect(goalsOf({ order: ['week', 'ride', 'trip', 'care', 'diary'], off: ['trip'] }).map((g) => [g.key, g.on]).slice(0, 2)).toEqual([['count', true], ['week', true]]);
    expect(goalsOf({ order: ['care'], off: [] }).find((g) => g.key === 'diary').on).toBe(false);
    expect(moveGoal(l, 0, 99)).toBe(l);
  });
  it('«Tick off» opens Aktiv (#/flow); a wall from before gets it once, in its ready place, and on', () => {
    expect(GOALS.find((g) => g.key === 'tick')).toMatchObject({ href: '#/flow', on: true });
    const old = goalsOf({ order: ['count', 'ride', 'trip', 'care', 'week', 'diary'], off: ['trip'] });
    expect(old.map((g) => [g.key, g.on]).slice(0, 3)).toEqual([['count', true], ['ride', true], ['tick', true]]);
  });
  it('every chip is German', () => {
    for (const g of GOALS) expect(DE[g.label], g.label).toBeTruthy();
  });
});
