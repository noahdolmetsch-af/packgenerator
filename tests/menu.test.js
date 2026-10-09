// v0.38.0 (Noah 11a-13a): the menu "More", "New" and the search find every page, each once.
import { describe, it, expect } from 'vitest';
import { MORE_GROUPS, MORE_ROWS, ACTIONS } from '../src/lib/nav/menu.js';
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
const PAGES = ['home', 'trips', 'pack', 'gear', 'bikes', 'care', 'templates', 'past', 'ride', 'share', 'blocks', 'features', 'favorites', 'inbox', 'notes', 'debrief', 'gearimport', 'wardrobe', 'review'];

describe('the menu "More"', () => {
  it('has the four groups Noah chose (v0.46.3: the packing-list group of 0.46.1 is gone again)', () => {
    expect(MORE_GROUPS.map((g) => g.key)).toEqual(['plan', 'back', 'gear', 'app']);
    expect(MORE_GROUPS.find((g) => g.key === 'plan').rows.map((r) => r.id)).toEqual(['templates', 'blocks']);
    expect(MORE_GROUPS.find((g) => g.key === 'app').rows.map((r) => r.id)).toEqual(['inbox', 'notes', 'data', 'features']);
  });

  it('lists every page exactly once across the places and "More"', () => {
    const hrefs = [...PLACES.map((p) => p.href), ...MORE_ROWS.filter((r) => r.href).map((r) => r.href)];
    expect(new Set(hrefs).size).toBe(hrefs.length);
    const reached = new Set(hrefs.map((h) => pageOf(h)));
    for (const page of PAGES) expect(reached.has(page) || page in ELSEWHERE, page).toBe(true);
  });

  it('has no row twice', () => {
    const ids = MORE_ROWS.map((r) => r.id);
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
    const page = searchAll('compare', {}).find((g) => g.kind === 'page').rows[0];
    expect(page.href).toBe('#/debrief/compare');
    const act = searchAll('tagestour', {}).find((g) => g.kind === 'action').rows[0];
    expect(act.action).toBe('dayride');
  });
});
