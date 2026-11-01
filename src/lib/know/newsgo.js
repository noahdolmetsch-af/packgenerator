/**
 * «Ausprobieren» (Noah 27.10.2026 «1a 2a 3a 4a 5a»): every line of «What is new» leads to the exact place of
 * what it brought, not just to a page. A line's target («go»):
 *   'f.merge'                      a function of the catalogue (features.js); its spot (know/spot.js SPOT) is lit
 *   { href, steps }                a page, then the steps of know/spot.js (tap, tap, … the last one lights up)
 *   { href, where, steps?, play? } a thing without a fixed place: the page where it shows up, and the line
 *                                  «where» (English key) says when; play: a day of the example trip (play.js DAYS)
 *   null                           no button: it no longer exists, or a fix without a place
 * New news files (src/lib/news/*.js) give each point its go (tests/newsgo.test.js); the older versions get
 * theirs from GO in newsgo-map.js, by the line's English text, newest first. A line without either keeps its
 * old href (just the page). Pure, no screen.
 */
import { GO } from './newsgo-map.js';
import { FEATURE, featureHref } from '../features.js';

/** The target of a line, as an object ({ feature } | { href, steps, where, play } | { href, action }), or null. */
export function goOf(p) {
  const g = p && Object.hasOwn(p, 'go') ? p.go : p && Object.hasOwn(GO, p.text) ? GO[p.text] : undefined;
  if (g === undefined) return p?.href || p?.action ? { href: p.href ?? null, action: p.action ?? null } : null;
  if (g === null) return null;
  return typeof g === 'string' ? { feature: g } : g;
}

/** Does the target lead to the exact place (a lit spot, a function, or a line where it shows up)? */
export const isExact = (g) => !!(g && (g.feature || g.steps?.length || g.where));

/** The address a line's link shows (the page; the jump itself runs on tap). bikeId fills «{bike}». */
export function hrefOf(g, { bikeId = null } = {}) {
  if (!g) return null;
  if (g.feature) return FEATURE[g.feature] ? featureHref(FEATURE[g.feature], { bikeId }) : null;
  return g.href ?? null;
}

/** The line «Ausprobieren» of a version takes: the first point with an exact target, else the first with any. */
export function tryOf(e) {
  const rows = [...(e?.points ?? []), ...(e?.small ?? [])].map((p) => ({ p, g: goOf(p) })).filter((x) => x.g);
  return rows.find((x) => isExact(x.g)) ?? rows[0] ?? null;
}
