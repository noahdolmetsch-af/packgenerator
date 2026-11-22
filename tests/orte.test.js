// «App-Landkarte» (Noah 22.11.2026 «1-3»): the guards W3 «Every page has a home» and W4 «One page, one place».
// A page that sits under no place leaves the bar without a mark (found with «Stopps in der Nähe»); a page file shown under
// two places is two homes with two names (found with «Impulse»). Both lists below may only get shorter.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { placeOf } from '../src/lib/nav.js';

const src = readFileSync(new URL('../src/App.svelte', import.meta.url), 'utf8');
const pagesIn = (cond) => [...cond.matchAll(/page === '([a-z0-9]+)'/g)].map((m) => m[1]);
const allPages = [...new Set(pagesIn(src))];
// the branches of App.svelte that show one page file under more than one page name: `page === 'a' || page === 'b'`
const branches = [...src.matchAll(/\{(?::else )?(?:#)?if ([^}]*)\}/g)].map((m) => pagesIn(m[1])).filter((l) => l.length > 1);

/** Pages for people without the app (a shared link, a card, a sign-up): they have no place on purpose. */
export const GAST_SEITEN = ['spurlink', 'gruppe', 'card', 'mitmachen', 'paylink', 'shopbuy'];
/** Page names of one page file that stand under another place on purpose: «Fahrten» is Auswerten › Fahrten and the same page as Touren (N1, Noah 20.10.2026). */
export const DOPPELT_ERLAUBT = ['stravarides'];

describe('W3: every page has a home', () => {
  const withoutPlace = allPages.filter((p) => placeOf(p, '#/') === null);
  it('a page without a place is a guest page', () => {
    expect(withoutPlace.filter((p) => !GAST_SEITEN.includes(p)), 'give these a place in placeOf (src/lib/nav.js)').toEqual([]);
  });
  it('a guest page that got a place leaves the list', () => {
    expect(GAST_SEITEN.filter((p) => !withoutPlace.includes(p)), 'take these out of GAST_SEITEN').toEqual([]);
  });
});

describe('W4: one page, one place', () => {
  it('names of one page file stand under one place', () => {
    const split = branches.filter((names) => new Set(names.map((p) => placeOf(p, '#/'))).size > 1 && !names.some((p) => DOPPELT_ERLAUBT.includes(p)));
    expect(split, 'these names of one page file sit under two places').toEqual([]);
  });
  it('an allowed double home is still one', () => {
    const split = DOPPELT_ERLAUBT.filter((p) => !branches.some((names) => names.includes(p) && new Set(names.map((x) => placeOf(x, '#/'))).size > 1));
    expect(split, 'take these out of DOPPELT_ERLAUBT').toEqual([]);
  });
  it('finds the branches it checks (the guard itself works)', () => {
    expect(allPages.length).toBeGreaterThan(100);
    expect(branches.some((n) => n.includes('frei') && n.includes('impulse'))).toBe(true); // the case that started this guard
  });
});
