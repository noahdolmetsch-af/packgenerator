/**
 * «Heute als Begleiter» PR 7 (Noah 28.10.2026 «1a 2a 3a»): «Belongs to …», a row of jump links on top of a page with the
 * functions of the same moment that are hard to find otherwise. Pack, Planen (Touren) and Ich (one small PR each).
 * Pure; the row (GehoertDazu.svelte) reads the data. Tested in tests/gehoert.test.js.
 */
import { FEATURES, featureHref } from '../features.js';
import { momentOfFeature } from '../moment.js';

/** The pages that show the row: page name (App.svelte) → moment key. A new page comes with its own PR. */
export const PAGE_MOMENT = { pack: 'packen', trips: 'planen', me: 'app' };
/** Chips shown before «all n ›». */
export const SHOWN = 5;

const pathOf = (href) => (href ?? '').split('?')[0];

/**
 * The row for a page: { items: [feature] (at most SHOWN), total }. The functions of the moment that lead somewhere other
 * than this page, never used first (in catalogue order), then the used ones; «Not for me» ones stay out.
 * here: the hash of the page ('#/pack'), used: ids of used functions, notForMe: { [id]: … }.
 */
export function gehoertDazu({ moment, here = '', used = new Set(), notForMe = {} } = {}) {
  const all = FEATURES.filter((f) => momentOfFeature(f.id) === moment && !notForMe[f.id]).filter((f) => {
    const p = pathOf(featureHref(f));
    return !p || p !== pathOf(here);
  });
  const sorted = [...all.filter((f) => !used.has(f.id)), ...all.filter((f) => used.has(f.id))];
  return { items: sorted.slice(0, SHOWN), total: all.length };
}

/** The catalogue by moment, opened for this moment (Features.svelte reads `by` and `moment`). */
export const allHref = (moment) => `#/features?by=moment&moment=${encodeURIComponent(moment)}`;
