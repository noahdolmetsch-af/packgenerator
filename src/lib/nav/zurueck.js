/**
 * Durchklick-Fund 3 (Noah 22.11.2026 «3a»): «Zurück» names where you came from, the bar marks the place of the page.
 * Wetter opened from Heute says «‹ Heute › Wetter» (the menu still marks Touren); a page opened by a link or the search,
 * with no way you came, says the place it belongs to, not a fixed other one («‹ Ich» above Gewicht, which stands in Aktiv).
 * Only the pages with a one-step path (one crumb before the page) change; a deeper path («Velo › Pflege › Verschleiss») keeps its steps.
 * Pure; herkunft.svelte.js keeps the last move, the three heads (VeloHead, PathHead, Crumbs) ask `backCrumbs`.
 */
import { pageOf, placeOf } from '../nav.js';

const placeOfAddress = (a) => placeOf(pageOf(a ?? ''), a ?? '');

/** The last move to remember: { from, to } when you stepped onto another page, `old` when you only stayed on it (a tab, a filter). */
export function prevMove(old, from, to) {
  if (from == null || pageOf(from) === pageOf(to ?? '')) return old ?? null;
  return { from, to: to ?? '' };
}

/**
 * The crumbs of a head with the first one changed: `prev` the remembered move, `here` the address of the page,
 * `labelOf(placeKey)` the name and `hrefOf(placeKey)` the address of a place. Returns `crumbs` itself when nothing changes.
 */
export function backCrumbs(crumbs, prev, here, labelOf, hrefOf = () => null) {
  if (!Array.isArray(crumbs) || crumbs.length !== 1) return crumbs;
  const own = placeOfAddress(here);
  const first = crumbs[0];
  const ownCrumb = placeOfAddress(first?.href);
  if (!own || !first) return crumbs;
  const came = prev && pageOf(prev.to) === pageOf(here) ? prev.from : null;
  if (came != null) {
    const from = placeOfAddress(came);
    const href = came || '#/';
    if (!from || href === first.href || (from === own && ownCrumb === own)) return crumbs;
    const label = labelOf(from);
    return label ? [{ ...first, label, href }] : crumbs;
  }
  // opened directly: the place of the page, when the crumb names another one
  if (ownCrumb === own) return crumbs;
  const label = labelOf(own);
  const href = hrefOf(own);
  return label && href ? [{ ...first, label, href }] : crumbs;
}
