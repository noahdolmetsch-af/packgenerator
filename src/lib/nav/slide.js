// «Bewegung beim Seitenwechsel» 1 «Richtung zeigen» (Noah 03.11.2026 «b», Paket A): a page that goes deeper
// (Touren → Tour → Packen) glides in from the right, the way back glides in from the left, so you feel where you are
// without reading the path line. Only the new page moves (the old one is gone at once, so nothing is on screen twice).
// Which way is a question of depth; this file knows it, App.svelte plays it (CSS `sw-slide-*` in app.css).

import { pageOf, placeOf, tabOf } from '../nav.js';

/** The pages you work in once you have picked a tour: they lie one step deeper than a tour's own page. */
const FLOW = new Set(['pack', 'ride', 'between', 'live']);
/** Rückblick pages that are a list or a tool, not one tour's flow (the same list as `calm` in App.svelte). */
const DEBRIEF_TOOLS = ['learnings', 'pace', 'compare', 'logbook'];

/**
 * How deep an address lies: 0 Heute, 1 a page of a place (a tab, or Ich itself), 2 a page you opened from there
 * (a tour, a ride, a tool), 3 the work on one tour (packing, riding, the Rückblick of one tour).
 */
export function depthOf(hash = '') {
  const h = hash || '#/';
  const page = pageOf(h);
  if (page === 'home') return 0;
  const param = (h.split('?')[0].split('/')[2] ?? '');
  if (FLOW.has(page) && !h.startsWith('#/pack/templates') && !h.startsWith('#/pack/past')) return 3;
  if (page === 'debrief' && param && !DEBRIEF_TOOLS.includes(param)) return 3;
  const place = placeOf(page, h);
  if (page === 'me') return 1;
  if (place && tabOf(place, h)) return 1;
  return 2;
}

/**
 * The way a change of page goes: 'fwd' (deeper), 'back' (higher) or null (same depth, or only moving between
 * the pages of the places at the top: Heute, the tabs, Ich; they keep standing still).
 */
export function slideDir(from = '', to = '') {
  const a = depthOf(from);
  const b = depthOf(to);
  if (a === b) return null;
  if (a <= 1 && b <= 1) return null;
  return b > a ? 'fwd' : 'back';
}

/** How long the glide lasts (ms); App.svelte takes the mark away after it, so a later part of the page appears without gliding. */
export const SLIDE_MS = 220;
