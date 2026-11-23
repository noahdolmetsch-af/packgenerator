// «Ein Ort pro Seite» (Noah 23.11.2026 «1-5a», V5): the search names the place of a page from the same source as the bar and the map of the app (nav.js).
import { describe, it, expect } from 'vitest';
import { PAGE_ROWS } from '../src/lib/nav/menu.js';
import { FEATURES, featureHref } from '../src/lib/features.js';
import { pageOf, placeOf, sidePlaceOf, PLACES } from '../src/lib/nav.js';
import { wegOf } from '../src/lib/nav/seiten.js';
import { searchAll } from '../src/lib/search.js';
import { MAP_PLACES } from '../src/lib/appmap.js';

const KEYS = new Set(MAP_PLACES.map((p) => p.key));
const label = (key) => (PLACES.find((p) => p.key === key) ?? { label: 'Me|place' }).label;

describe('one place for every page', () => {
  it('every address of the catalogue and of the search has a place of the bar or «Ich»', () => {
    const hrefs = [...FEATURES.map((f) => featureHref(f)), ...PAGE_ROWS.map((r) => r.href)].filter(Boolean);
    for (const h of new Set(hrefs)) expect(KEYS.has(sidePlaceOf(placeOf(pageOf(h), h))), h).toBe(true);
  });
  it('the search row of a page says the place of nav.js, not the hand-written group of menu.js', () => {
    for (const r of PAGE_ROWS.filter((x) => x.href)) {
      const w = wegOf(r.href);
      expect(w, r.id).not.toBeNull();
      expect(w.place, r.id).toBe(label(w.placeKey));
    }
    const rows = (q) => searchAll(q).find((g) => g.kind === 'page')?.rows ?? [];
    const ms = rows('meilensteine milestones').find((r) => r.href === '#/flow/milestones') ?? rows('milestones').find((r) => r.href === '#/flow/milestones');
    expect(ms, 'Milestones is found').toBeTruthy();
    expect(ms.sub).toBe('Analysis › Rides');
    
  });
  it('names the tab as well: Analysis › Rides for the milestones', () => {
    const w = wegOf('#/flow/milestones');
    expect(w).toMatchObject({ placeKey: 'analysis', place: 'Analysis|place' });
    expect(w.tab).toBeTruthy();
  });
});
