// «Packen in Schritten» (Warteliste 4; Noah «2a», «3a»): src/lib/pack/schritte.js
import { describe, it, expect } from 'vitest';
import { STEPS, stepOfCategory, cleanChoice, orderedSteps, moveStep, viewOf, stepGroups, nextGroup } from '../src/lib/pack/schritte.js';
import { STD_CATEGORIES } from '../src/lib/gear.js';

describe('steps', () => {
  it('the first order is Clothes, Sleeping, Food, Tech, Bike, Check', () => {
    expect(STEPS.map((s) => s.key)).toEqual(['clothes', 'sleep', 'food', 'tech', 'bike', 'check']);
  });
  it('every category of the app has a step, and no category is in two', () => {
    const seen = new Map();
    for (const s of STEPS) for (const c of s.cats) {
      expect(seen.has(c), `${c} twice`).toBe(false);
      seen.set(c, s.key);
    }
    for (const c of STD_CATEGORIES) expect(stepOfCategory(c.key), c.key).toBeTruthy();
  });
  it('an own category or none lands in Check', () => {
    expect(stepOfCategory('my-own')).toBe('check');
    expect(stepOfCategory(undefined)).toBe('check');
  });
});

describe('order and view', () => {
  it('cleans the stored choice', () => {
    expect(cleanChoice(null)).toEqual({ view: null, order: [] });
    expect(cleanChoice({ view: 'x', order: ['food', 'food', 'zzz', 'sleep'] })).toEqual({ view: null, order: ['food', 'sleep'] });
  });
  it('completes a short order and moves with arrows', () => {
    expect(orderedSteps(['food']).map((s) => s.key)).toEqual(['food', 'clothes', 'sleep', 'tech', 'bike', 'check']);
    expect(moveStep([], 'sleep', -1).slice(0, 2)).toEqual(['sleep', 'clothes']);
    expect(moveStep([], 'clothes', -1)[0]).toBe('clothes'); // the first cannot go up
    expect(moveStep([], 'check', 1).at(-1)).toBe('check');
    // only the steps that show count as neighbours: Tech moves above Sleeping, over Food that has nothing in it
    expect(moveStep([], 'tech', -1, ['clothes', 'sleep', 'tech'])).toEqual(['clothes', 'tech', 'food', 'sleep', 'bike', 'check']);
  });
  it('opens in Steps for a fresh list and in the bags for a list under way; a remembered choice wins', () => {
    expect(viewOf(null, [{ packed: false }])).toBe('steps');
    expect(viewOf(null, [{ packed: true }])).toBe('bags');
    expect(viewOf({ view: 'category' }, [])).toBe('category');
  });
});

describe('stepGroups', () => {
  const items = [
    { id: 'a', category: 'rain' },
    { id: 'b', category: 'food' },
    { id: 'c', category: 'mine' },
    { id: 'd', category: 'sleep' },
  ];
  const zones = [{ entries: [{ itemId: 'a' }, { itemId: 'b' }] }, { entries: [{ itemId: 'c' }, { itemId: 'd' }] }];
  it('sorts the entries into their steps, only steps with something in them', () => {
    const g = stepGroups(zones, items);
    expect(g.map((x) => x.step)).toEqual(['clothes', 'sleep', 'food', 'check']);
    expect(g.find((x) => x.step === 'check').entries.map((e) => e.itemId)).toEqual(['c']);
  });
  it('keeps every entry exactly once', () => {
    expect(stepGroups(zones, items).flatMap((g) => g.entries).length).toBe(4);
  });
  it('follows the order and names the next step', () => {
    const g = stepGroups(zones, items, ['food']);
    expect(g[0].step).toBe('food');
    expect(nextGroup(g, g[0].key).step).toBe('clothes');
    expect(nextGroup(g, g.at(-1).key)).toBe(null);
  });
});
