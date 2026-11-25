/**
 * «Klügere Suche» (Noah 24.11.2026 «1-5a», Stufe 1, Thread «Suche, Hilfe und Assistent zu einem vereinen»): the order of the results
 * and where the gear stands. Before: gear (the things you own, a jersey) always came first and Enter opened a gear item.
 * Now: pages and functions first, then trips, bikes, notes, diary, logbook, templates, and gear last. Gear stands in front only where it
 * makes sense (the gear pages, packing, sets), with the button «Material», with a word like «Teil» or «Gewicht», or when nothing else fits;
 * otherwise it is one folded line «Material: 7 Teile ›». Nothing is lost: the line, the button and the context find every item.
 * Pure (no database, no screen), tested in tests/ordnung.test.js. Titles are English keys for t().
 */
import { pageOf, tabOf, placeOf, PLACE_TABS } from '../nav.js';
import { fold } from '../search.js';

/** The kinds in the order they are shown (gear last; before it came first). */
export const ORDER = ['page', 'action', 'setting', 'trip', 'ride', 'place', 'bike', 'care', 'note', 'diary', 'log', 'learning', 'training', 'task', 'template', 'gear'];

/** The buttons under the field: which kinds each one shows. 'pages' also shows the functions of the catalogue. */
export const FILTERS = [
  { key: 'all', label: 'All|map', kinds: null },
  { key: 'pages', label: 'Pages', kinds: ['page', 'action', 'setting'] },
  { key: 'trips', label: 'Trips|place', kinds: ['trip', 'template', 'ride', 'place'] },
  { key: 'bikes', label: 'Bikes', kinds: ['bike', 'care'] },
  { key: 'notes', label: 'Notes', kinds: ['note', 'diary', 'log', 'learning', 'task', 'training'] },
  { key: 'gear', label: 'Gear', kinds: ['gear'] },
];

/** The pages of the gear: Material, Vorrat, Sets, Bausteine, Ausrüstung and the packing list. */
const GEAR_PAGES = new Set(['gear', 'supplies', 'lend', 'power', 'gearimport', 'favorites', 'blocks', 'blockcheck', 'packcleanup', 'wardrobe', 'equipment', 'pack']);

/** True where the gear is what you look for: the gear pages, packing, sets (read from the address, like nav.js). */
export function gearContext(hash = '') {
  const h = String(hash ?? '');
  if (!h.startsWith('#/')) return false;
  if (GEAR_PAGES.has(pageOf(h))) return !h.startsWith('#/pack/past') && !h.startsWith('#/pack/templates');
  return placeOf(pageOf(h), h) === 'bikes' && ['gear', 'sets'].includes(tabOf('bikes', h));
}

/** Words that say «my things» (folded): the gear stands in front. */
const GEAR_WORDS = ['teil', 'teile', 'gewicht', 'material', 'sachen', 'item', 'items', 'gear', 'weight', 'ausruestung'];

/** True when a word of the search says gear («teil», «gewicht», «material»). */
export const saysGear = (q) => fold(q).split(/\s+/).some((w) => GEAR_WORDS.includes(w));

const rows = (g) => (g?.rows?.length ?? 0) + (g?.more ?? 0);
/** The rows of a group that are strong hits (a name matched), see `weak` in search.js. */
const strong = (g) => ({ ...g, rows: g.rows.filter((r) => !r.weak) });
const clean = (title) => String(title ?? '').replace(/^★ /, '');

/** How many hits each button would show: { pages, trips, bikes, notes, gear } (the functions of the catalogue are added by the screen). */
export function countsOf(groups) {
  const n = Object.fromEntries(FILTERS.filter((f) => f.kinds).map((f) => [f.key, groups.filter((g) => f.kinds.includes(g.kind)).reduce((m, g) => m + rows(g), 0)]));
  return n;
}

/**
 * The groups of a search as they are shown (Noah 24.11.2026 «1-4a»).
 * Input: groups from smartSearch, { filter, context: bool (the gear pages), learned: bool (you opened gear for this word before), q,
 * other: number of other strong hits (functions, commands, answers) }.
 * Output: { groups, gear, weak, counts }:
 *  - groups: the strong hits in the order of ORDER;
 *  - gear: null, or { n, names } when the gear stays folded (one line with its first names);
 *  - weak: the hits that only name the word in running text (a note, a logbook text), shown last and quieter: [{ ...row, from, fromKind }];
 *  - counts: the number of hits per button.
 * Only a STRONG hit (a name matched) may fold the gear away: a logbook text that mentions «Trikot» does not hide your jerseys.
 */
export function arrange(groups, { filter = 'all', context = false, learned = false, q = '', other = 0 } = {}) {
  const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
  const byKind = (a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind);
  const counts = countsOf(groups);
  if (f.kinds) return { groups: groups.filter((g) => f.kinds.includes(g.kind)).sort(byKind), gear: null, weak: null, counts };
  const weak = [...groups]
    .sort(byKind)
    .flatMap((g) => g.rows.filter((r) => r.weak).map((r) => ({ ...r, from: g.name, fromKind: g.kind })))
    .slice(0, 4);
  const strongGroups = groups.map(strong).filter((g) => g.rows.length);
  const rest = strongGroups.filter((g) => g.kind !== 'gear').sort(byKind);
  const gear = strongGroups.find((g) => g.kind === 'gear');
  const wk = weak.length ? weak : null;
  if (!gear) return { groups: rest, gear: null, weak: wk, counts };
  const lead = context || learned || saysGear(q);
  if (lead) return { groups: [gear, ...rest], gear: null, weak: wk, counts };
  if (!rest.length && !other) return { groups: [gear], gear: null, weak: wk, counts };
  // something strong fits: the gear is one folded line with its first names
  return { groups: rest, gear: { n: rows(gear), names: gear.rows.slice(0, 3).map((r) => clean(r.title)) }, weak: wk, counts };
}

/**
 * The topics of an empty search (Noah 24.11.2026 «1-5a», point 2): six tiles; a tap shows the pages of the topic.
 * The pages are read from the tabs of nav.js (PLACE_TABS), so they follow every rebuild; only «Packing» and «App» are written by hand.
 * label/sub/titles are English keys for t(); a row is { title, href }.
 */
const tab = (place, ...keys) => keys.map((k) => PLACE_TABS[place].find((x) => x.key === k)).filter(Boolean).map((x) => ({ title: x.label, href: x.href }));
const subs = (place, key) => (PLACE_TABS[place].find((x) => x.key === key)?.subs ?? []).map((x) => ({ title: x.label, href: x.href }));

export const TOPICS = [
  { key: 'packing', label: 'Packing|topic', sub: 'Lists, bags, templates', rows: () => [{ title: 'Packing list', href: '#/pack' }, { title: 'Templates', href: '#/pack/templates' }, { title: 'Building blocks', href: '#/blocks' }, { title: 'Gear|place', href: '#/gear' }] },
  { key: 'trips', label: 'Trips|place', sub: 'Plan, suggestions, races', rows: () => tab('trips', 'overview', 'dreams', 'races', 'lookback') },
  { key: 'bike', label: 'Bike|topic', sub: 'Care, kilometres, parts', rows: () => tab('bikes', 'bikes', 'care', 'sets') },
  { key: 'body', label: 'Body|topic', sub: 'Recovery, pulse, sleep', rows: () => subs('analysis', 'verlauf') },
  { key: 'weather', label: 'Weather|place', sub: 'Now, windows, clothes', rows: () => [{ title: 'Weather|place', href: '#/wetter' }] },
  { key: 'app', label: 'App|topic', sub: 'Settings, backup, help', rows: () => [{ title: 'Appearance', href: '#/me/look' }, { title: 'Data and backup', href: '#/me/data' }, { title: 'Map of the app', href: '#/me/karte' }] },
];
