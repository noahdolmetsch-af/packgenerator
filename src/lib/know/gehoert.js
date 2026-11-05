/**
 * «Heute als Begleiter» PR 7 (Noah 28.10.2026 «1a 2a 3a»): «Belongs to …», a row of jump links on top of a page with the
 * functions of the same moment that are hard to find otherwise. Pack, Planen (Touren) and Ich (one small PR each).
 * Pure; the row (GehoertDazu.svelte) reads the data. Tested in tests/gehoert.test.js.
 */
import { FEATURES, featureHref } from '../features.js';
import { momentOfFeature } from '../moment.js';

/** The pages that show the row: page name (App.svelte) → moment key. A new page comes with its own PR.
 * «Wegweiser statt Katalog» PR 10 (Noah 01.11.2026 «1a 2a 3a 4a 5a»): Velos, Material and Aktiv too.
 * «Aktiv und Auswerten» 1a (Noah 03.11.2026): Aktiv leaves the list, «Alles hier» (ui/AllHere.svelte) stands there now.
 * Idea D4 «App denkt mit» (Noah 02.11.2026 «3b»): Rückblick (hub only), Neuland and Wetter too. */
export const PAGE_MOMENT = { pack: 'packen', trips: 'planen', me: 'app', bikes: 'velo', gear: 'velo', debrief: 'zurueck', neuland: 'lust', wetter: 'planen' };
/** Pages whose row shows only on the page itself, not on its sub-pages (a form like #/flow/edit/… stays quiet). */
export const HUB_ONLY = ['bikes', 'gear', 'debrief'];
/** Chips shown before «all n ›». */
export const SHOWN = 5;

const pathOf = (href) => (href ?? '').split('?')[0];

/** Whether the row shows for this page and hash: a page of PAGE_MOMENT, and for HUB_ONLY only on '#/page' itself. */
export function showsRow(page, hash = '') {
  if (!PAGE_MOMENT[page]) return false;
  return !HUB_ONLY.includes(page) || pathOf(hash).replace(/\/$/, '') === `#/${page}`;
}

/**
 * The row for a page: { items: [feature] (at most SHOWN), total }. The functions of the moment that lead somewhere other
 * than this page, never used first (in catalogue order), then the used ones; «Not for me» ones stay out.
 * here: the hash of the page ('#/pack'), used: ids of used functions, notForMe: { [id]: … }.
 * under: also leave out the page's own sub-pages ('#/flow/sports' on '#/flow'), which the page already leads to (PR 10).
 */
export function gehoertDazu({ moment, here = '', used = new Set(), notForMe = {}, under = false } = {}) {
  const all = FEATURES.filter((f) => momentOfFeature(f.id) === moment && !notForMe[f.id]).filter((f) => {
    const p = pathOf(featureHref(f));
    return !p || (p !== pathOf(here) && !(under && p.startsWith(`${pathOf(here)}/`)));
  });
  const sorted = [...all.filter((f) => !used.has(f.id)), ...all.filter((f) => used.has(f.id))];
  return { items: sorted.slice(0, SHOWN), total: all.length };
}

/** The catalogue by moment, opened for this moment (Features.svelte reads `by` and `moment`). */
export const allHref = (moment) => `#/features?by=moment&moment=${encodeURIComponent(moment)}`;
