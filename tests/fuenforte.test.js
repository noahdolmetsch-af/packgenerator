// v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): the pages under each place (sidebar) and the
// keyboard shortcuts. Pure functions, no data.
import { describe, it, expect } from 'vitest';
import { PLACES, ALL_PLACES, PLACE_TABS, tabOf, subOf, pageOf, placeOf } from '../src/lib/nav.js';
import { shortcutOf } from '../src/lib/nav/keys.js';
// «Ganze App neu denken» Schritt 12: the pages of Auswerten are chips (`subs`) under five tabs; `leaf` is the page an address belongs to
const leaf = (place, h) => subOf(place, h)?.key ?? tabOf(place, h);

describe('the pages under each place', () => {
  it('each place has at most 4, and only built pages (O2.1a: Neuland and Heft come later; v0.78.0 O2.5a: Einkauf shows the wishlist; v0.79.0: Aktivität is built; UC3 14.10.2026 «2a»: Velos gets «Setup» as a fifth; Paket 2: Aktiv gets «Meditation» (ME2, Noah 15.10.2026 «1a») and «Training» (TR2, Noah 13.10.2026 «1-5a» 1a) as its own tabs; Paket N: Touren gets «Träume» (Noah 19.10.2026 «1a») next to «Skitouren»)', () => {
    // «Auswerten aufräumen» (Noah 07.11.2026 «4a»): Auswerten gets «Gipfelbuch» as a tab (17), the link cards of the start are gone; «Fragen» (Plan 4a, Noah 08.11.2026 «D b») is the first tab (18)
    const max = { bikes: 5, active: 4, analysis: 18, trips: 8, week: 12, gear: 7 }; // Schritt 10 «Ganze App neu denken» (Noah 18.11.2026): Touren + Inspiration (8), Material + Sets (7); the next steps 4b, 11, 13 bring them down to 3 and 4, then these limits go down with them // «Aktiv und Auswerten» 3a (Noah 03.11.2026): Auswerten gets Heatmap, Neuland, Gelernt and Jahr // Analyse (Noah 27.10.2026 «1a»): Auswerten gets «Analyse» as a tab // Alltag sichtbar (Noah 24.10.2026 «1a»): Planen + Merken // «Alles finden 2» (Noah 22.10.2026 «4a 5a»): Touren, Planen and Material got tabs; // «Aktiv neu» (Noah 22.10.2026): Aktiv has 4 tabs, «Auswerten» the looking pages // «Tagebuch» (Noah 20.10.2026): a tab of Planen next to Notizen // UI-Ziele #6 (Noah 20.10.2026 «freigabe» 4a): Ich keeps data, settings, help; the rest are tabs of Planen and Auswerten // N1 «Neue Leiste» (Noah 20.10.2026): Fahrten and Erkenntnisse go to Auswerten; Planen gets Termine and Notizen // Gesamttest 20.10.2026 B3 (Noah «3a»): Touren gets «Fahrten», the Strava activities // Paket T (Noah 19.10.2026 «1a und b»): Aktiv gets «Impulse» as a sixth tab
    for (const p of ALL_PLACES) expect((PLACE_TABS[p.key] ?? []).length, p.key).toBeLessThanOrEqual(max[p.key] ?? 4);
    const keys = Object.values(PLACE_TABS).flat().map((x) => x.key);
    for (const later of ['heft']) expect(keys).not.toContain(later);
  });

  it('every entry leads to a page of its own place', () => {
    for (const [place, tabs] of Object.entries(PLACE_TABS)) for (const x of tabs) expect([x.href, placeOf(pageOf(x.href, x.href.includes('tab=care')), x.href)]).toEqual([x.href, place]);
  });

  it('marks the entry an address belongs to', () => {
    expect(tabOf('trips', '#/trips')).toBe('overview');
    expect(tabOf('trips', '#/pack/templates')).toBe('templates');
    expect(tabOf('trips', '#/debrief/learnings')).toBe('lookback');
    expect(tabOf('trips', '#/pack/past')).toBe('lookback');
    expect(tabOf('trips', '#/heatmap')).toBe(null); // «Aktiv und Auswerten» 3a: Heatmap, Neuland, Gelernt and Jahr are Auswerten now
    for (const [h, k] of [['#/heatmap', 'heatmap'], ['#/neuland?c=cantons', 'neuland'], ['#/gelernt/2026-10', 'learned'], ['#/jahr/2026', 'year']]) expect(leaf('analysis', h), h).toBe(k);
    expect(tabOf('trips', '#/pack')).toBe(null); // a trip: no entry lit
    expect(tabOf('trips', '#/trips/rides')).toBe(null); // N1: Fahrten is Auswerten › Fahrten now
    expect(leaf('analysis', '#/trips/rides')).toBe('rides');
    expect(leaf('analysis', '#/me/insights')).toBe('insights');
    // «Ganze App neu denken» Schritt 11 (Noah 18.11.2026): Planen has three tabs (Woche, Notizen, Alltag); the old pages are chips under them
    expect(tabOf('week', '#/me/agenda')).toBe('week');
    expect(subOf('week', '#/me/agenda').key).toBe('agenda');
    expect(tabOf('week', '#/notes')).toBe('notes');
    // «Tagebuch» (Noah 20.10.2026): a page of Planen, also for one entry
    expect(tabOf('week', '#/tagebuch')).toBe('notes');
    expect(subOf('week', '#/tagebuch/e1').key).toBe('tagebuch');
    expect(placeOf(pageOf('#/tagebuch'))).toBe('week');
    for (const [h, tab, sub] of [['#/week', 'week', 'week'], ['#/week/plan', 'week', 'week'], ['#/week/away', 'week', 'week'], ['#/me/agenda', 'week', 'agenda'], ['#/notes', 'notes', 'notes'], ['#/calendar', 'notes', 'remember'], ['#/inbox', 'notes', 'inbox'], ['#/tagebuch', 'notes', 'tagebuch'], ['#/me/mail', 'notes', 'mail'], ['#/me/alltag', 'alltag', 'alltag'], ['#/me/frei', 'alltag', 'frei'], ['#/me/compass', 'alltag', 'compass'], ['#/me/links', 'alltag', 'links']]) {
      expect(tabOf('week', h), h).toBe(tab);
      expect(subOf('week', h)?.key, h).toBe(sub);
    }
    for (const [h, k] of [['#/me/history', 'history'], ['#/me/abfragen', 'history'], ['#/me/analysis', 'history'], ['#/me/wohl', 'wohl'], ['#/me/weight', 'weight']]) expect(leaf('analysis', h), h).toBe(k);
    for (const h of ['#/me', '#/me/data', '#/me/look', '#/me/connections', '#/features']) expect(placeOf(pageOf(h)), h).toBe('me');
    expect(placeOf(pageOf('#/trips/rides'))).toBe('analysis');
    expect(placeOf(pageOf('#/trips'))).toBe('trips');
    expect(tabOf('trips', '#/trips/dreams')).toBe('dreams');
    // V5 (Noah 21.11.2026): Material is the tab «Material» of Velos und Material, its pages are chips
    for (const [h, tab, chip] of [['#/gear?tab=weigh', 'gear', 'all'], ['#/favorites', 'gear', 'all'], ['#/wardrobe', 'gear', 'clothes'], ['#/blocks/check', 'sets', 'blocks'], ['#/gear?view=wish', 'gear', 'wish'], ['#/gear?view=never', 'gear', 'all'], ['#/gear/supplies', 'gear', 'supplies'], ['#/gear/lend', 'gear', 'lend'], ['#/equipment', 'sets', 'sets'], ['#/bikes', 'bikes', 'overview'], ['#/bikes?tab=rig', 'bikes', 'rig'], ['#/bikes?tab=compare', 'bikes', 'fit'], ['#/bikes?tab=care', 'care', 'care'], ['#/care', 'care', 'care'], ['#/bikes?tab=shop', 'care', 'shop']]) {
      expect(tabOf('bikes', h), h).toBe(tab);
      expect(subOf('bikes', h)?.key, h).toBe(chip);
    }
    expect(tabOf('bikes', '#/bikes?bike=x')).toBe('bikes');
    expect(tabOf('bikes', '#/bikes?tab=care&bike=x')).toBe('care');
    expect(tabOf('bikes', '#/care')).toBe('care');
    expect(leaf('bikes', '#/bikes?tab=shop')).toBe('shop');
    expect(leaf('bikes', '#/bikes?tab=compare')).toBe('fit');
    expect(tabOf('week', '#/flow')).toBe('training'); // V4a: the pages of Aktiv are chips under the tab «Training» of Woche
    expect(subOf('week', '#/flow').key).toBe('flowhome');
    expect(subOf('week', '#/flow/goals').key).toBe('sports');
    // «Aktiv neu» (Noah 22.10.2026): Aktiv is for doing, «Auswerten» for looking
    for (const [h, k] of [['#/flow/sports', 'sports'], ['#/flow/sport/act:yoga', 'sports'], ['#/flow/act/meditation', 'meditation'], // V4b2: Meditation is a chip of «Alltag»
       ['#/flow/bags', 'sports'], ['#/flow/training', 'training'], ['#/flow/rest', 'rest'], ['#/flow/week', 'flowhome']]) expect(subOf('week', h)?.key, h).toBe(k);
    for (const [h, k] of [['#/auswerten', 'start'], ['#/flow/form', 'form'], ['#/flow/stats/hr', 'body'], ['#/flow/auswertung', 'ticks'], ['#/flow/milestones?act=yoga', 'milestones'], ['#/flow/trophies', 'milestones'], ['#/flow/ideen', 'ideen']]) {
      expect(leaf('analysis', h), h).toBe(k);
      expect(placeOf(pageOf(h), h), h).toBe('analysis');
    }
    // «Impulse» moved from Auswerten to Planen › Freie Zeit (Noah 21.11.2026 «2a»); its address stays
    expect(leaf('week', '#/flow/impulse')).toBe('impulse');
    expect(placeOf(pageOf('#/flow/impulse'), '#/flow/impulse')).toBe('week');
    expect(placeOf(pageOf('#/flow/sports'), '#/flow/sports')).toBe('week');
    expect(tabOf('today', '#/')).toBe(null);
  });
});

describe('keyboard shortcuts', () => {
  it('g and a letter open a place', () => {
    expect(shortcutOf('g')).toEqual({ wait: true });
    expect(PLACES.map((p) => shortcutOf(p.letter, true))).toEqual(PLACES.map((p) => ({ go: p.href })));
    expect(shortcutOf('m', true)).toEqual({ go: '#/gear' }); // V5: Material is a tab of Velos und Material; g m still opens it
    expect(PLACES.map((p) => p.letter)).toEqual(['h', 'w', 't', 'v', 'a', 'q']); // «Quick Links» (Noah 28.10.2026): g q // «Woche planen» (Noah 15.10.2026 «1a»): g w; N1: the order of the new bar, letters unchanged
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
