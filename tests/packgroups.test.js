// v0.114.0 «Rahmenbedingungen» (Noah 12.10.2026, answers 4b, 7a, 3b): the new trip's list in four groups,
// worn items apart, and two example templates per kind of trip. Fictional items only.
import { describe, it, expect } from 'vitest';
import { groupOf, groupEntries, PACK_GROUPS, examplesFor } from '../src/lib/packgroups.js';
import { TRIP_DOMAINS } from '../src/lib/domains.js';
import DE from '../src/lib/i18n/de/index.js';

const it_ = (id, category, f = {}) => ({ id, name: `test_data_gtp_ ${id}`, category, weightG: 100, qty: 1, ...f });
const items = [it_('a', 'onbike'), it_('b', 'rain'), it_('c', 'tools'), it_('d', 'elec'), it_('e', 'light'), it_('f', 'offbike'), it_('h', 'onbike', { role: 'worn' }), it_('n', 'food', { weightG: null })];

describe('groupOf', () => {
  it('clothing, electronics, gear; the weather\'s cold layers as Extra warm', () => {
    expect(groupOf(items[0])).toBe('clothes');
    expect(groupOf(items[1])).toBe('clothes');
    expect(groupOf(items[2])).toBe('gear');
    expect(groupOf(items[4])).toBe('elec');
    expect(groupOf(items[5], new Set(['f']))).toBe('warm');
    expect(groupOf({ id: 'x' })).toBe('gear');
  });
});

describe('groupEntries', () => {
  const entries = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'n', 'gone'].map((itemId) => ({ itemId, slot: itemId === 'h' ? 'body' : 'seat', qty: itemId === 'c' ? 2 : 1 }));
  const r = groupEntries(entries, items, new Set(['f']));
  it('counts only the bag items; worn ones apart; unknown items left out', () => {
    expect(r.bag).toBe(7);
    expect(r.worn.map((i) => i.id)).toEqual(['h']);
  });
  it('H01: the slot decides, as the button «x in the bags · y on me» counts; without a slot the role', () => {
    const r2 = groupEntries([{ itemId: 'h', slot: 'seat' }, { itemId: 'a', slot: 'hip' }, { itemId: 'h' }], items);
    expect(r2.bag).toBe(1);
    expect(r2.worn.map((i) => i.id)).toEqual(['a', 'h']);
  });
  it('groups in display order with their weights', () => {
    expect(r.groups.map((g) => g.key)).toEqual(['clothes', 'gear', 'elec', 'warm']);
    expect(r.groups.find((g) => g.key === 'gear').w).toMatchObject({ g: 200, missing: 1 });
    expect(r.groups.reduce((s, g) => s + g.n, 0)).toBe(r.bag);
  });
  it('every group name has a German text', () => {
    for (const g of PACK_GROUPS) expect(DE[g.name], g.name).toBeTruthy();
  });
});

describe('example templates (answer 3b)', () => {
  it('two per offered kind of trip, with German names and days', () => {
    // Data cleanup 14.10.2026: the examples are on the areas (domains.js DOMAINS[].examples).
    const withExamples = TRIP_DOMAINS.filter((d) => d.examples).map((d) => d.key);
    expect(withExamples).toEqual(['bikepacking', 'ski', 'hiking']);
    for (const key of withExamples) {
      expect(examplesFor(key)).toHaveLength(2);
      for (const ex of examplesFor(key)) {
        expect(DE[ex.name], ex.name).toBeTruthy();
        expect(ex.days).toBeGreaterThan(0);
      }
    }
    expect(examplesFor('weekend')).toEqual([]);
  });
});
