// UI-Ziele #7 «Handy-Längenbudget» (Noah 20.10.2026): the budget only lists pages that are still too long.
import { describe, it, expect } from 'vitest';
import { TOO_LONG, MAX_SCREENS, budgetOf } from '../src/lib/laenge.js';
import { PLACES, PLACE_TABS } from '../src/lib/nav.js';

describe('phone length budget', () => {
  it('three screens unless a page is on the list; the list only names pages over three', () => {
    expect(MAX_SCREENS).toBe(3);
    expect(budgetOf('#/trips')).toBe(3);
    for (const [h, n] of Object.entries(TOO_LONG)) expect(n, h).toBeGreaterThan(MAX_SCREENS);
  });
  it('every page on the list is a place, a tab or Ich (so the guard measures it)', () => {
    const known = new Set(['#/me', ...PLACES.map((p) => p.href), ...Object.values(PLACE_TABS).flat().map((x) => x.href)]);
    for (const h of Object.keys(TOO_LONG)) expect(known.has(h), h).toBe(true);
  });
});
