// v0.38.0 (Noah 11a-13a): the menu "More", "New" and the search find every page, each once.
// v0.76.0 «Fünf Orte» 1: «More» is gone; every page lives under its place or in «Ich» (#/me).
import { describe, it, expect } from 'vitest';
import { PAGE_GROUPS, PAGE_ROWS, ACTIONS } from '../src/lib/nav/menu.js';
import { PLACES, pageOf } from '../src/lib/nav.js';
import { searchAll } from '../src/lib/search.js';

// Pages reached on purpose without a menu entry of their own, with where they are reached.
const ELSEWHERE = {
  pack: 'a trip from Trips (#/trips, v0.46.1) or Today; the lists are no longer in More (v0.46.3, Noah)',
  care: 'Bikes → Care (a tab of the Bikes place)',
  ride: 'the trip band on a ride day',
  share: 'a shared link only',
  gearimport: 'Gear → Import (the import flow)',
};
const PAGES = ['home', 'trips', 'pack', 'gear', 'bikes', 'care', 'templates', 'past', 'ride', 'share', 'blocks', 'features', 'favorites', 'inbox', 'notes', 'debrief', 'gearimport', 'wardrobe', 'flow', 'me', 'blockcheck'];
// v0.49.0 R1: #/review is part of the one Rückblick page (#/debrief) now; nav.js redirectOf leads there.

describe('the pages under the places and «Ich» (v0.76.0)', () => {
  it('groups the pages by their place, «Ich» last', () => {
    expect(PAGE_GROUPS.map((g) => g.key)).toEqual(['trips', 'gear', 'active', 'me']);
    expect(PAGE_GROUPS.find((g) => g.key === 'trips').rows.map((r) => r.id)).toEqual(['templates', 'debriefs', 'past', 'learnings', 'pace']);
    expect(PAGE_GROUPS.find((g) => g.key === 'me').rows.map((r) => r.id)).toEqual(['inbox', 'notes', 'data', 'features', 'me']);
  });

  it('every page is reached by a place or a page row (the places\' own pages once)', () => {
    const rows = PAGE_ROWS.filter((r) => r.href).map((r) => r.href);
    expect(new Set(rows).size).toBe(rows.length);
    const hrefs = [...PLACES.map((p) => p.href), ...rows.filter((h) => !PLACES.some((p) => p.href === h))];
    expect(new Set(hrefs).size).toBe(hrefs.length);
    const reached = new Set(hrefs.map((h) => pageOf(h)));
    for (const page of PAGES) expect(reached.has(page) || page in ELSEWHERE, page).toBe(true);
  });

  it('has no row twice', () => {
    const ids = PAGE_ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const actions = ACTIONS.map((a) => a.id);
    expect(new Set(actions).size).toBe(actions.length);
  });
});

describe('the search finds pages and actions', () => {
  it('"vorl" finds the page Templates and "New template"', () => {
    const r = searchAll('vorl', {});
    expect(r.find((g) => g.kind === 'page').rows.map((x) => x.id)).toContain('templates');
    expect(r.find((g) => g.kind === 'action').rows.map((x) => x.id)).toContain('template');
  });

  it('finds the rarer pages by English or German words', () => {
    for (const [q, id] of [['packlisten', 'templates'], ['vergangene', 'past'], ['tempo', 'pace'], ['backup', 'data'], ['inbox', 'inbox'], ['favoriten', 'favorites'], ['bausteine', 'blocks']]) {
      const rows = searchAll(q, {}).flatMap((g) => g.rows);
      expect(rows.map((x) => x.id), q).toContain(id);
    }
  });

  it('a page row opens its page, an action row runs its action', () => {
    // v0.49.0 R1: «Touren vergleichen» is a part of the Rückblick page
    const page = searchAll('compare', {}).find((g) => g.kind === 'page').rows[0];
    expect(page.href).toBe('#/debrief');
    const act = searchAll('tagestour', {}).find((g) => g.kind === 'action').rows[0];
    expect(act.action).toBe('dayride');
  });
});
