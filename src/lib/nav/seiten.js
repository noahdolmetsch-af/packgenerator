/**
 * «Die Suche findet Seiten» (thread «Navigation ohne Sackgassen», Noah 23.11.2026 «ja»): every place, tab and page chip of the map
 * of the app (nav.js) is a row the search can find, besides the hand-written rows of nav/menu.js (which keep their words and come first).
 * [{ id, href, label (English key), place (English key of the place), tab (English key of the tab, for a chip) }]
 */
import { PLACE_TABS, ALL_PLACES, pageOf, placeOf } from '../nav.js';

export function mapPages() {
  const out = [];
  const seen = new Set();
  const add = (row) => {
    if (!row.href || seen.has(row.href)) return;
    seen.add(row.href);
    out.push(row);
  };
  for (const p of ALL_PLACES) {
    if (p.key === 'quick' || p.key === 'equipment' || p.key === 'today') continue;
    add({ id: `map:${p.key}`, href: p.href, label: p.label, place: p.label, placeKey: p.key });
    for (const tab of PLACE_TABS[p.key] ?? []) {
      add({ id: `map:${p.key}:${tab.key}`, href: tab.href, label: tab.label, place: p.label, placeKey: p.key, tabKey: tab.key });
      for (const sub of tab.subs ?? []) add({ id: `map:${p.key}:${tab.key}:${sub.key}`, href: sub.href, label: sub.label, place: p.label, placeKey: p.key, tab: tab.label, tabKey: tab.key, subKey: sub.key });
    }
  }
  return out;
}

/**
 * «Ein Ort pro Seite» (Noah 23.11.2026 «1-5a», V5): where a page lives, read from the same source as the bar and the map of the app
 * (nav.js), never from the hand-written groups of menu.js. → { place (English key), tab (English key or null), placeKey } or null.
 * «Meilensteine» lives under Auswerten › Fahrten, not under Woche.
 */
export function wegOf(href) {
  if (!href) return null;
  const placeKey = placeOf(pageOf(href), href);
  const place = ALL_PLACES.find((p) => p.key === placeKey) ?? (placeKey === 'me' ? { label: 'Me|place' } : null);
  if (!place) return null;
  const tab = (PLACE_TABS[placeKey] ?? []).find((x) => x.match?.(href)) ?? null;
  return { placeKey, place: place.label, tab: tab && tab.href !== place.href ? tab.label : null };
}
