/**
 * «Pfad auf jeder Seite anzeigen» step 5 (Noah 28.10.2026 «1a und c und d alle»): «Map of the app» (#/me/karte).
 * Built from the catalogue (features.js), so it is never out of date: every place of the app (Trips, Gear, Bikes,
 * Active, Me) with its functions, each with its path «Place › Function» and where it leads.
 * Pure (no database, no screen), tested in tests/appmap.test.js. Titles are English keys for t().
 */
import { FEATURES, pageOf, featureHref } from './features.js';
import { PLACES, PLACE_TABS, pageOf as pageOfHash, placeOf, sidePlaceOf } from './nav.js';
import { NEWS_INDEX_ALL } from './whatsnew.js';
import { pathOf } from './quick/usage.js';

/**
 * «Karte der App» als Skizze (Noah 23.11.2026 «1a 2b 3a 4a 5a», Schritte 1 und 4): the places are the ones of the bar and the
 * sidebar (read from nav.js, never kept by hand): Heute, Woche, Touren, Velos und Material, Auswerten, Wetter, and «Ich» for
 * data, settings and help. Before: five old areas (Touren, Material, Velos, Heute abhaken, Ich with 257 of 503 functions).
 */
export const MAP_PLACES = [...PLACES.filter((p) => p.key !== 'quick'), { key: 'me', label: 'Me|place' }];
/** features.js groups its pages by the old areas; a function without an address (a window) goes by this table. */
const OLD_TO_PLACE = { trips: 'trips', gear: 'bikes', bikes: 'bikes', flow: 'week', me: 'me' };
const PLACE_KEYS = new Set(MAP_PLACES.map((p) => p.key));

/** The place of the bar a function lives in: by its address (nav.js placeOf), else by its old area. */
export function placeOfFeature(f, { bikeId = null } = {}) {
  const href = featureHref(f, { bikeId });
  const hit = href ? sidePlaceOf(placeOf(pageOfHash(href), href)) : null; // Quick Links stands under Heute
  return PLACE_KEYS.has(hit) ? hit : (OLD_TO_PLACE[pageOf(f)] ?? 'me');
}

/**
 * The map: [{ key, label, items: [{ id, title, text, href, path }], points: [{ path, href, title, ids }] }], places in the order
 * of the bar, empty ones left out. A point is a page or tab (an address without its filter) with the functions that live on it;
 * a function without an address is a point of its own.
 */
export function buildMap({ bikeId = null } = {}) {
  const groups = MAP_PLACES.map((g) => ({ key: g.key, label: g.label, items: [], points: [] }));
  const at = Object.fromEntries(groups.map((g) => [g.key, g]));
  for (const f of FEATURES) {
    const g = at[placeOfFeature(f, { bikeId })];
    const href = featureHref(f, { bikeId });
    g.items.push({ id: f.id, title: f.title, text: f.text, href, path: [g.label, f.title] });
    const path = href ? pathOf(href) : `run:${f.id}`;
    const point = g.points.find((x) => x.path === path);
    if (!point) g.points.push({ path, href: href ? path : null, title: f.title, ids: [f.id], exact: !!href && href.split('?')[0].replace(/\/+$/, '') === href });
    else {
      point.ids.push(f.id);
      // the title of a page is the title of the function that sits on the page itself (no filter), else the first one
      if (!point.exact && href && href === path) Object.assign(point, { title: f.title, exact: true });
    }
  }
  return groups.filter((g) => g.items.length);
}

/** Versions of the last `days` days: the functions they brought (the field «since» of the news files). */
export function freshIds(today, days = 14, list = NEWS_INDEX_ALL) {
  const from = new Date(`${today}T12:00:00Z`).getTime() - days * 864e5;
  return new Set(list.filter((e) => e.date && new Date(`${e.date}T12:00:00Z`).getTime() >= from).flatMap((e) => e.since ?? []));
}

/**
 * What a point shows: 'open' (this device opened the page, or the data shows you used one of its functions), 'new' (a function
 * of the last two weeks, not opened yet) or 'never'. opened: { [path]: day } of this device (quick/usage.js), used: Set of ids.
 */
export function markOf(point, { opened = {}, used = new Set(), fresh = new Set() } = {}) {
  if ([point.path, ...(point.alsoPaths ?? [])].some((x) => opened[x]) || point.ids.some((id) => used.has(id))) return 'open';
  return point.ids.some((id) => fresh.has(id)) ? 'new' : 'never';
}

/** The map reduced to the points of one filter: 'all', 'never' (marks 'never' and 'new') or 'new'. */
export function filterPoints(map, filter, state) {
  if (filter === 'all') return map;
  const ok = (p) => (filter === 'new' ? markOf(p, state) === 'new' : markOf(p, state) !== 'open');
  return map.map((g) => ({ ...g, points: g.points.filter(ok) })).filter((g) => g.points.length);
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

/**
 * «Karte der App» als Baum (Noah 24.11.2026 «a» on «ich bin total unzufrieden»): place › tab › page. The tabs are the ones of the place
 * (PLACE_TABS in nav.js, never kept by hand) and the pages under a tab are the chips under it. «Ich» has no tabs: its groups are the ones of the
 * page «Ich» (ICH_GROUPS, checked by tests/appmap.test.js against src/pages/Me.svelte). What fits no tab stands under «Further pages»,
 * a function without an address (a window) under «Windows and actions». Nothing is left out: every point of the place is in exactly one page row.
 */
export const ICH_GROUPS = [
  { key: 'data', label: 'Data', re: /^(#\/me\/(data|connections|fitbit|docs|trash)|#\/me|run:(backup|demo|f\.autobackup))$/ },
  { key: 'reminders', label: 'Reminders', re: /^#\/me\/(reminders|push|hinweise)$/ },
  { key: 'settings', label: 'Settings', re: /^(#\/me\/(look|werte|lists|suche|ruhig(\/.*)?|checks|regeln)|run:(lang|f\.search))$/ },
  { key: 'help', label: 'Help|me', re: /^(#\/(features|assistent)|#\/me\/(karte|news|logbuch|privacy|handbook)|run:install)$/ },
  { key: 'more', label: 'More', re: /^(#\/(kurse)|#\/me\/(apps|mini(\/.*)?|next|ki-projekte|album|freunde|pros|tennis(\/.*)?)|run:f\.playground)$/ },
];

/** One row of the tree for a point or a group of points (the chips of a tab that lead to the same page are one row). */
function pageRow(p) {
  return { path: p.path, alsoPaths: [], href: p.href, title: p.title, ids: [...p.ids] };
}

/** The tabs of a place with their pages: [{ key, label, href, pages: [{ path, href, title, ids, alsoPaths }] }], empty ones left out. */
export function buildTree(g) {
  const tabs = [];
  const place = PLACE_TABS[g.key] ?? [];
  const add = (key, label, href, rows) => rows.length && tabs.push({ key, label, href, pages: rows });
  const rest = [];
  if (g.key === 'me') {
    const at = new Map(ICH_GROUPS.map((x) => [x.key, []]));
    for (const p of g.points) {
      const hit = ICH_GROUPS.find((x) => x.re.test(p.path));
      if (hit) at.get(hit.key).push(pageRow(p));
      else rest.push(pageRow(p));
    }
    for (const x of ICH_GROUPS) add(x.key, x.label, null, at.get(x.key));
  } else if (place.length) {
    const rows = new Map(place.map((t) => [t.key, new Map()]));
    const windows = [];
    for (const p of g.points) {
      const h = p.href;
      const tab = h ? place.find((t) => t.match(h)) : null;
      if (!tab) { (h ? rest : windows).push(pageRow(p)); continue; }
      const sub = tab.subs?.find((x) => x.match(h)) ?? null;
      const k = sub?.key ?? p.path;
      const m = rows.get(tab.key);
      const row = m.get(k);
      if (!row) m.set(k, { ...pageRow(p), title: sub?.label ?? p.title, href: sub?.href ?? p.href, rank: sub ? tab.subs.indexOf(sub) : 99 });
      else { row.ids.push(...p.ids); row.alsoPaths.push(p.path); }
    }
    for (const t of place) add(t.key, t.label, t.href, [...rows.get(t.key).values()].sort((a, b) => a.rank - b.rank));
    if (windows.length) rest.push(...windows);
  } else rest.push(...g.points.map(pageRow));
  add('rest', 'Further pages', null, rest.filter((r) => r.href));
  add('windows', 'Windows and actions', null, rest.filter((r) => !r.href));
  return tabs;
}
