// «Wegweiser statt Katalog» PR 11: the card «What you can do here».
import { describe, it, expect } from 'vitest';
import { pageContent, pageKey, ON_PAGES, foldedOf, isFolded, FOLDED_FIRST } from '../src/lib/seiteninhalt.js';
import { HOME } from '../src/lib/know/heimat.js';

describe('What you can do here', () => {
  it('reads the page from the hash, keeping only tab, view and open', () => {
    expect(pageKey('#/bikes?view=x&tab=care&q=1')).toBe('#/bikes?tab=care&view=x');
    expect(pageKey('#/me/frei/lust')).toBe('#/me/frei/lust');
  });
  it('every switched-on page has at least one function, each with what for and how it works', () => {
    for (const p of ON_PAGES) {
      const rows = pageContent(p);
      expect(rows.length, p).toBeGreaterThan(0);
      for (const r of rows) {
        expect(r.text, r.id).toBeTruthy();
        expect(r.steps.length + (r.example ? 1 : 0), r.id).toBeGreaterThan(0);
        expect(pageKey(HOME[r.id])).toBe(p);
      }
    }
  });
  it('shows nothing on pages not switched on, nor on Today', () => {
    expect(pageContent('#/')).toEqual([]);
    expect(pageContent('#/pack')).toEqual([]);
    expect(pageContent('#/pack', ['#/pack']).length).toBeGreaterThan(0);
  });
  it('keeps only folded pages from the stored setting', () => {
    expect(foldedOf({ '#/a': true, '#/b': false, '#/c': 1 })).toEqual({ '#/a': true });
    expect(foldedOf(null)).toEqual({});
  });
  it('starts folded on Unterwegs, keeps the choice everywhere', () => {
    expect(FOLDED_FIRST).toContain('#/ride');
    expect(isFolded({}, '#/ride')).toBe(true);
    expect(isFolded({ '#/ride': false }, '#/ride')).toBe(false);
    expect(isFolded({}, '#/trips/dreams')).toBe(false);
    expect(isFolded({ '#/trips/dreams': true, '#/x': 1 }, '#/trips/dreams')).toBe(true);
  });
});
