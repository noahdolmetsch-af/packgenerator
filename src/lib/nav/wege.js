/**
 * «Wege» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»): the beginning of the path above a page comes
 * from the one map of the app, src/lib/nav.js (pageOf → placeOf → tabOf, the same that lights the sidebar), and no
 * longer from a name every page wrote by hand («Aktiv › …» when the place had become «Woche»).
 *   trailOf(hash)           the canonical start: the place and, when the page is under a tab, the tab.
 *   keepSteps(hash, passed) the steps a page passes itself (its crumbs) that still make sense after that start:
 *                           only steps inside the same place, and none that is a place or a tab (the start says that).
 * Pure (no screen, no translation): the labels stay English keys; the components translate them (wege.svelte.js).
 * Tested in tests/wege.test.js; the browser check of every address is tests/e2e/wege-waechter.spec.js.
 */
import { pageOf, placeOf, tabOf, PLACE_TABS, ALL_PLACES } from '../nav.js';

/** «Ich» is no place of the sidebar (a card under it), but it is the start of the path of its pages. */
export const ME = { key: 'me', href: '#/me', label: 'Me|place' };

const entryOf = (key) => (key === 'me' ? ME : ALL_PLACES.find((p) => p.key === key) ?? null);

/** The place an address belongs to (the one the sidebar lights), or null for a page of a guest. «Quick Links» stands under Heute. */
export function placeKeyOf(hash = '') {
  const key = placeOf(pageOf(hash, false), hash);
  return key === 'quick' ? 'today' : key;
}

/** The addresses that are a place or a tab: «#/bikes» (without a query), «#/bikes?tab=care» (exactly). */
function roots() {
  const out = new Set(['#/', ...ALL_PLACES.map((p) => p.href), ME.href]);
  for (const tabs of Object.values(PLACE_TABS)) for (const t of tabs) for (const x of [t, ...(t.subs ?? [])]) if (x.href) out.add(x.href);
  return out;
}
const ROOTS = roots();

/** A place or a tab (of any place): a step like this is what the canonical start says already. */
export const isRoot = (href = '') => ROOTS.has(href) || (!String(href).includes('?') && ROOTS.has(String(href)));

/**
 * The canonical start of the path: [{ kind: 'place', place, entry, href }, { kind: 'tab', place, entry, href }?].
 * null when the address belongs to no place (a page for someone without the app).
 */
export function trailOf(hash = '') {
  const place = placeKeyOf(hash);
  const p = place ? entryOf(place) : null;
  if (!p) return null;
  const out = [{ kind: 'place', place, entry: p, href: p.href }];
  const tab = (PLACE_TABS[place] ?? []).find((x) => x.key === tabOf(place, hash));
  if (tab) out.push({ kind: 'tab', place, entry: tab, href: tab.href });
  return out;
}

/** The steps a page passes that stay: inside the same place, and no place or tab. [{ href, label }] */
export function keepSteps(hash = '', passed = []) {
  const place = placeKeyOf(hash);
  return (passed ?? []).filter((s) => s?.href && !isRoot(s.href) && placeKeyOf(s.href) === place);
}
