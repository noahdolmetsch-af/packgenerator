/**
 * Durchklick Etappe 2, Frage 5a (Noah 05.11.2026): a page whose code is still loading shows its name at once, above the
 * placeholder. The name is the one of the path line: the tab when the page has one, else the place («Vorrat», «Touren»).
 * Pure; LazyPage.svelte uses it. Returns '' when the address belongs to no place.
 */
import { pageOf, placeOf, tabOf, ALL_PLACES, PLACE_TABS } from '../nav.js';
import { placeLabel, tabLabel } from '../anpassen.svelte.js';

export function waitTitle(hash = '') {
  const page = pageOf(hash);
  const place = placeOf(page, hash);
  const p = ALL_PLACES.find((x) => x.key === place);
  if (!p) return '';
  const tab = (PLACE_TABS[place] ?? []).find((x) => x.key === tabOf(place, hash));
  return tab ? tabLabel(place, tab) : placeLabel(p);
}
