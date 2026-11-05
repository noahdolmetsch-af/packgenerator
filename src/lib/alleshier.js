/**
 * «Alles hier» (Noah 03.11.2026 «1a», plan PR 3–9 «freigabe»): on top of an area page, every function of the area as a
 * tile, one tap away, so nothing hides behind a sub-page or far down. The tiles are functions of «What the app can do»
 * (src/lib/features.js): their name and page come from there. Everything is a suggestion: the order can change
 * (arrows and drag), a tile can be hidden (Undo) and shown again, «As at the start» resets. Pure; the card is
 * src/lib/ui/AllHere.svelte, tested in tests/alleshier.test.js.
 */
import { FEATURES } from './features.js';
import { TIP } from './tips.js';

/**
 * The functions of each area, in their first order. One PR per area adds its list. An entry is a feature id, or
 * { id, title, href } for a page that has no function of its own in features.js (its English title goes through t()).
 */
export const ALL_HERE = {
  // Aktiv (Noah 03.11.2026 «1a»): the functions of doing, ten tiles on top of Aktiv
  aktiv: ['f.sportpage', 'f.timer', 'f.trainplans', 'f.training', 'f.weekplan', 'f.weekreview', 'f.meditation', 'f.routine', 'f.gipfelbuch', 'f.milestones'],
  bikes: ['f.partwear', 'f.inspect', 'f.workshop', 'f.spick', 'f.workshoprounds', 'f.sparestock', 'f.wearphotos', 'f.bikeseason', 'f.bikeyear', 'f.sellbike', 'f.bikebox', 'f.velofaq', 'f.strava', 'f.kmimport', 'f.velosetup', 'f.bagplan', 'f.setuplog', 'f.equipment', 'f.bikecompare', 'f.measure', 'f.garmin', 'f.folder', 'f.breakin', 'f.repairkit', 'f.warranty', 'f.theft', 'f.bikeservice', 'f.setupphotos'],
  gear: [
    'f.gearimport',
    { id: 'blocks', title: 'Building blocks', href: '#/blocks' },
    'f.blockcheck',
    'f.packcleanup',
    'f.wardrobe',
    { id: 'favorites', title: 'Favourites', href: '#/favorites' },
    { id: 'wishlist', title: 'Wishlist', href: '#/gear?tab=wishlist' },
    'f.shop',
    { id: 'print', title: 'Share or print a list (PDF)', href: '#/pack?print' },
    'f.supplies',
    'f.power',
    'f.lend',
    'f.merge',
    'f.lighter',
  ],
  trips: [
    { id: 'numbers', title: 'In numbers', href: '#/trips?numbers' },
    'templates',
    'f.fuel',
    'f.tripcompare',
    'f.weather',
    'f.travel',
    'f.tripcheck',
    'f.departsheet',
    'f.dreams',
    'f.race',
    'f.racecheck',
    { id: 'ski', title: 'Ski tours', href: '#/ski' },
    { id: 'mountain', title: 'Mountain and emergency', href: '#/mountain' },
    'f.quiz',
  ],
  plan: [
    'f.agenda',
    'f.remember',
    { id: 'notes', title: 'Notes', href: '#/notes' },
    'f.inbox',
    { id: 'matters', title: 'Matters', href: '#/inbox/vorgaenge' },
    'f.reminders',
    'f.shopping',
    'f.cook',
    'f.contracts',
    'f.people',
    { id: 'friends', title: 'With friends', href: '#/me/freunde' },
    { id: 'minitools', title: 'Mini tools', href: '#/me/mini' },
    'f.journal',
    'f.photoalbum',
    'f.docs',
    'f.compass',
    'f.ruhig',
    'f.plantpass',
  ],
};

const idOf = (e) => (typeof e === 'string' ? e : e.id);
const ENTRY = Object.fromEntries(Object.values(ALL_HERE).flat().filter((e) => typeof e !== 'string').map((e) => [e.id, e]));

/** The settings key of an area: { order: [ids], hidden: [ids] }. */
export const allHereKey = (area) => `alleshier.${area}`;

const BY_ID = Object.fromEntries(FEATURES.map((f) => [f.id, f]));

/** A function the field can show: it has a page in features.js. */
const pageOf = (id) => ENTRY[id]?.href ?? BY_ID[id]?.href ?? (BY_ID[id]?.tip ? TIP[BY_ID[id].tip]?.go?.href : null) ?? null;
const known = (id) => !!pageOf(id);

/** The ids of an area, in their first order. */
export const areaIds = (area) => (ALL_HERE[area] ?? []).map(idOf);

/**
 * The tile of a function: its id, English title (for t()) and page. A page with a place holder (e.g. «{bike}» for the
 * bike folder) takes it from vars; null when it has no page or a place holder stays open (e.g. no bike yet).
 */
export function tileOf(id, vars = {}) {
  if (ENTRY[id]) return { ...ENTRY[id] };
  const f = BY_ID[id];
  // a function from the tips (tips.js) has its page in go.href
  const page = pageOf(id);
  if (!page) return null;
  const href = page.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? encodeURIComponent(vars[k]) : m));
  if (href.includes('{')) return null;
  return { id, title: f.title, href };
}

/** The ids of an area as the user arranged them: all (hidden ones at their place), shown, hidden. Unknown ids are left out, new ones go last. */
function ids(area, state) {
  const list = areaIds(area).filter(known);
  const order = (state?.order ?? []).filter((id) => list.includes(id));
  const all = [...order, ...list.filter((id) => !order.includes(id))];
  const hidden = new Set((state?.hidden ?? []).filter((id) => list.includes(id)));
  return { all, shown: all.filter((id) => !hidden.has(id)), hidden: all.filter((id) => hidden.has(id)) };
}

/**
 * The tiles of an area as the user arranged them: { all, ids (shown ids), shown, hidden }. A tile whose place holder
 * stays open (no bike yet) is not shown but keeps its place.
 */
export function arrange(area, state = null, vars = {}) {
  const r = ids(area, state);
  const tile = (id) => tileOf(id, vars);
  return { all: r.all, ids: r.shown, shown: r.shown.map(tile).filter(Boolean), hidden: r.hidden.map(tile).filter(Boolean) };
}

/** The state after moving a shown tile one place up (-1) or down (+1). */
export function step(area, state, id, dir) {
  const { shown: list, hidden } = ids(area, state);
  const i = list.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return state;
  [list[i], list[j]] = [list[j], list[i]];
  return { order: [...list, ...hidden], hidden };
}

/** The state after dragging a shown tile from place «from» to place «to» (places in arrange().ids). */
export function moveTo(area, state, from, to) {
  const { shown: list, hidden } = ids(area, state);
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return state;
  const [x] = list.splice(from, 1);
  list.splice(to, 0, x);
  return { order: [...list, ...hidden], hidden };
}

/** The state after hiding (true) or showing (false) a tile. */
export function setHidden(area, state, id, hide) {
  const { all: order, hidden } = ids(area, state);
  const h = new Set(hidden);
  if (hide) h.add(id);
  else h.delete(id);
  return { order, hidden: order.filter((x) => h.has(x)) };
}
