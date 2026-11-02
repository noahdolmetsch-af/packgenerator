// «Wegweiser statt Katalog» PR 11: the card «What you can do here».
import { describe, it, expect } from 'vitest';
import { pageContent, pageKey, pagePattern, fits, samplePage, RESERVED, ON_PAGES, foldedOf, isFolded, FOLDED_FIRST } from '../src/lib/seiteninhalt.js';
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
    expect(pageContent('#/pack', [])).toEqual([]); // a page that is not in the list shows nothing
    expect(pageContent('#/pack', ['#/pack']).length).toBeGreaterThan(0);
  });
  it('keeps only folded pages from the stored setting', () => {
    expect(foldedOf({ '#/a': true, '#/b': false, '#/c': 1 })).toEqual({ '#/a': true });
    expect(foldedOf(null)).toEqual({});
  });
  it('starts folded on Unterwegs, keeps the choice everywhere', () => {
    expect(FOLDED_FIRST).toEqual(expect.arrayContaining(['#/ride', '#/bikes', '#/gear', '#/debrief/:trip']));
    expect(isFolded({}, '#/ride')).toBe(true);
    expect(isFolded({ '#/ride': false }, '#/ride')).toBe(false);
    expect(isFolded({}, '#/trips/dreams')).toBe(false);
    expect(isFolded({ '#/trips/dreams': true, '#/x': 1 }, '#/trips/dreams')).toBe(true);
  });
  it('a page of one thing finds its pattern; fixed sub-pages and other depths do not (PR 21)', () => {
    expect(pagePattern('#/debrief/test_trip_1', ['#/debrief/:trip'])).toBe('#/debrief/:trip');
    expect(pagePattern('#/debrief/logbook', ['#/debrief/:trip'])).toBe('');
    expect(pagePattern('#/debrief/ride/r1', ['#/debrief/:trip'])).toBe('');
    expect(pagePattern('#/notes?open=n1&q=x', ['#/notes?open=:note'])).toBe('#/notes?open=:note');
    expect(pagePattern('#/notes', ['#/notes?open=:note'])).toBe('');
    expect(pagePattern('#/race/r1/ride', ['#/race/:race', '#/race/:race/route'])).toBe('');
    expect(pagePattern('#/race/r1', ['#/race/:race', '#/debrief/:trip'])).toBe('#/race/:race');
    expect(fits('#/x/a.b', '#/x/:id')).toBe(true);
    for (const w of RESERVED) expect(fits(`#/debrief/${w}`, '#/debrief/:trip')).toBe(false);
  });
  it('a fixed page wins over a pattern', () => {
    expect(pagePattern('#/debrief/pace', ['#/debrief/:trip', '#/debrief/pace'])).toBe('#/debrief/pace');
  });
  it('one trip\'s debrief shows the functions written for #/debrief/:trip', () => {
    const rows = pageContent('#/debrief/test_trip_1');
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(HOME[r.id]).toBe('#/debrief/:trip');
  });
  it('every placeholder page of ON_PAGES has a real id that finds its own pattern (PR 21)', () => {
    for (const p of ON_PAGES.filter((x) => x.includes(':'))) {
      const real = samplePage(p);
      expect(real, p).not.toContain(':');
      expect(pagePattern(real), p).toBe(p);
      expect(pageContent(real).length, p).toBeGreaterThan(0);
    }
    expect(samplePage('#/debrief/:trip', { trip: 'abc' })).toBe('#/debrief/abc');
  });
});
