// v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): the pages under each place (sidebar) and the
// keyboard shortcuts. Pure functions, no data.
import { describe, it, expect } from 'vitest';
import { PLACES, PLACE_TABS, tabOf, pageOf, placeOf } from '../src/lib/nav.js';
import { shortcutOf } from '../src/lib/nav/keys.js';

describe('the pages under each place', () => {
  it('each place has at most 4, and only built pages (O2.1a: Neuland, Heft and Einkauf come later)', () => {
    for (const p of PLACES) expect((PLACE_TABS[p.key] ?? []).length, p.key).toBeLessThanOrEqual(4);
    const keys = Object.values(PLACE_TABS).flat().map((x) => x.key);
    for (const later of ['neuland', 'heft', 'shopping', 'activity']) expect(keys).not.toContain(later);
  });

  it('every entry leads to a page of its own place', () => {
    for (const [place, tabs] of Object.entries(PLACE_TABS)) for (const x of tabs) expect([x.href, placeOf(pageOf(x.href, x.href.includes('tab=care')))]).toEqual([x.href, place]);
  });

  it('marks the entry an address belongs to', () => {
    expect(tabOf('trips', '#/trips')).toBe('overview');
    expect(tabOf('trips', '#/pack/templates')).toBe('templates');
    expect(tabOf('trips', '#/debrief/learnings')).toBe('lookback');
    expect(tabOf('trips', '#/pack/past')).toBe('lookback');
    expect(tabOf('trips', '#/pack')).toBe(null); // a trip: no entry lit
    expect(tabOf('gear', '#/gear?tab=weigh')).toBe('all');
    expect(tabOf('gear', '#/favorites')).toBe('all');
    expect(tabOf('gear', '#/wardrobe')).toBe('clothes');
    expect(tabOf('gear', '#/blocks/check')).toBe('blocks');
    expect(tabOf('bikes', '#/bikes?bike=x')).toBe('overview');
    expect(tabOf('bikes', '#/bikes?tab=care&bike=x')).toBe('care');
    expect(tabOf('bikes', '#/care')).toBe('care');
    expect(tabOf('bikes', '#/bikes?tab=shop')).toBe('shop');
    expect(tabOf('bikes', '#/bikes?tab=compare')).toBe('fit');
    expect(tabOf('active', '#/flow')).toBe('today');
    expect(tabOf('active', '#/flow/goals')).toBe('goals');
    expect(tabOf('today', '#/')).toBe(null);
  });
});

describe('keyboard shortcuts', () => {
  it('g and a letter open a place', () => {
    expect(shortcutOf('g')).toEqual({ wait: true });
    expect(PLACES.map((p) => shortcutOf(p.letter, true))).toEqual(PLACES.map((p) => ({ go: p.href })));
    expect(PLACES.map((p) => p.letter)).toEqual(['h', 't', 'm', 'v', 'a']);
  });

  it('a letter without g does nothing, except n, i, / and ?', () => {
    expect(shortcutOf('h')).toBe(null);
    expect(shortcutOf('t')).toBe(null);
    expect(shortcutOf('n')).toEqual({ act: 'new' });
    expect(shortcutOf('i')).toEqual({ act: 'me' });
    expect(shortcutOf('/')).toEqual({ act: 'search' });
    expect(shortcutOf('?')).toEqual({ act: 'help' });
    expect(shortcutOf('x', true)).toBe(null);
  });
});
