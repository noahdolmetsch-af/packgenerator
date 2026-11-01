/**
 * «Pfad auf jeder Seite anzeigen» step 5 (Noah 28.10.2026 «1a und c und d alle»): «Map of the app» (#/me/karte).
 * Built from the catalogue (features.js), so it is never out of date: every place of the app (Trips, Gear, Bikes,
 * Active, Me) with its functions, each with its path «Place › Function» and where it leads.
 * Pure (no database, no screen), tested in tests/appmap.test.js. Titles are English keys for t().
 */
import { FEATURES, PAGE_GROUPS, pageOf, featureHref } from './features.js';

/** The map: [{ key, label, icon, items: [{ id, title, text, href, path }] }], places in order, empty ones left out. */
export function buildMap({ bikeId = null } = {}) {
  return PAGE_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    icon: g.icon,
    items: FEATURES.filter((f) => pageOf(f) === g.key).map((f) => ({
      id: f.id,
      title: f.title,
      text: f.text,
      href: featureHref(f, { bikeId }),
      path: [g.label, f.title],
    })),
  })).filter((g) => g.items.length);
}

const norm = (s) => String(s ?? '').toLowerCase();

/** The map reduced to what matches q (every word in the title, text or place; tr is t()); no q: the map as it is. */
export function filterMap(map, q, tr = (s) => s) {
  const words = norm(q).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return map;
  return map
    .map((g) => ({ ...g, items: g.items.filter((i) => {
      const hay = norm([i.title, tr(i.title), i.text, tr(i.text), tr(g.label)].join(' '));
      return words.every((w) => hay.includes(w));
    }) }))
    .filter((g) => g.items.length);
}

/** The path as one line, «Me › Understand the app». */
export const pathText = (item, tr = (s) => s) => item.path.map((p) => tr(p)).join(' › ');

/** Number of functions on the map. */
export const mapSize = (map) => map.reduce((n, g) => n + g.items.length, 0);
