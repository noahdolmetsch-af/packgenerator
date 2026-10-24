// v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): the pages under each place (sidebar) and the
// keyboard shortcuts. Pure functions, no data.
import { describe, it, expect } from 'vitest';
import { PLACES, PLACE_TABS, tabOf, pageOf, placeOf } from '../src/lib/nav.js';
import { shortcutOf } from '../src/lib/nav/keys.js';

describe('the pages under each place', () => {
  it('each place has at most 4, and only built pages (O2.1a: Neuland and Heft come later; v0.78.0 O2.5a: Einkauf shows the wishlist; v0.79.0: Aktivität is built; UC3 14.10.2026 «2a»: Velos gets «Setup» as a fifth; Paket 2: Aktiv gets «Meditation» (ME2, Noah 15.10.2026 «1a») and «Training» (TR2, Noah 13.10.2026 «1-5a» 1a) as its own tabs; Paket N: Touren gets «Träume» (Noah 19.10.2026 «1a») next to «Skitouren»)', () => {
    const max = { bikes: 5, active: 11, trips: 7, week: 11, gear: 6 }; // «Alles finden 2» (Noah 22.10.2026 «4a 5a»): on a phone the rest stands in «Alle n» with a sentence each; Touren + Reise-Links, Werkzeugkasten; Planen + Inspiration, Links; Material + Vorrat, Ausgeliehen // «Tagebuch» (Noah 20.10.2026): a tab of Planen next to Notizen // UI-Ziele #6 (Noah 20.10.2026 «freigabe» 4a): Ich keeps data, settings, help; the rest are tabs of Planen and Auswerten // N1 «Neue Leiste» (Noah 20.10.2026): Fahrten and Erkenntnisse go to Auswerten; Planen gets Termine and Notizen // Gesamttest 20.10.2026 B3 (Noah «3a»): Touren gets «Fahrten», the Strava activities // Paket T (Noah 19.10.2026 «1a und b»): Aktiv gets «Impulse» as a sixth tab
    for (const p of PLACES) expect((PLACE_TABS[p.key] ?? []).length, p.key).toBeLessThanOrEqual(max[p.key] ?? 4);
    const keys = Object.values(PLACE_TABS).flat().map((x) => x.key);
    for (const later of ['neuland', 'heft']) expect(keys).not.toContain(later);
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
    expect(tabOf('trips', '#/trips/rides')).toBe(null); // N1: Fahrten is Auswerten › Fahrten now
    expect(tabOf('active', '#/trips/rides')).toBe('rides');
    expect(tabOf('active', '#/me/insights')).toBe('insights');
    expect(tabOf('week', '#/me/agenda')).toBe('agenda');
    expect(tabOf('week', '#/notes')).toBe('notes');
    // «Tagebuch» (Noah 20.10.2026): a tab of Planen, also for one entry
    expect(tabOf('week', '#/tagebuch')).toBe('tagebuch');
    expect(tabOf('week', '#/tagebuch/e1')).toBe('tagebuch');
    expect(placeOf(pageOf('#/tagebuch'))).toBe('week');
    for (const [h, k] of [['#/week/plan', 'week'], ['#/week/away', 'week'], ['#/calendar', 'agenda'], ['#/inbox', 'inbox'], ['#/me/mail', 'mail'], ['#/me/compass', 'compass'], ['#/me/alltag', 'alltag'], ['#/me/frei', 'frei']]) expect(tabOf('week', h), h).toBe(k);
    for (const [h, k] of [['#/me/history', 'history'], ['#/me/abfragen', 'history'], ['#/me/analysis', 'history'], ['#/me/wohl', 'wohl'], ['#/me/weight', 'weight']]) expect(tabOf('active', h), h).toBe(k);
    for (const h of ['#/me', '#/me/data', '#/me/look', '#/me/connections', '#/features']) expect(placeOf(pageOf(h)), h).toBe('me');
    expect(placeOf(pageOf('#/trips/rides'))).toBe('active');
    expect(placeOf(pageOf('#/trips'))).toBe('trips');
    expect(tabOf('trips', '#/trips/dreams')).toBe('dreams');
    expect(tabOf('gear', '#/gear?tab=weigh')).toBe('all');
    expect(tabOf('gear', '#/favorites')).toBe('all');
    expect(tabOf('gear', '#/wardrobe')).toBe('clothes');
    expect(tabOf('gear', '#/blocks/check')).toBe('blocks');
    expect(tabOf('gear', '#/gear?view=wish')).toBe('shop');
    expect(tabOf('gear', '#/gear?view=never')).toBe('all');
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
    expect(PLACES.map((p) => p.letter)).toEqual(['h', 'w', 't', 'a', 'v', 'm']); // «Woche planen» (Noah 15.10.2026 «1a»): g w; N1: the order of the new bar, letters unchanged
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
