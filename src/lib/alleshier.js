/**
 * «Alles hier» (Noah 03.11.2026 «1a», plan PR 3–9 «freigabe»): on top of an area page, every function of the area as a
 * tile, one tap away, so nothing hides behind a sub-page or far down. The tiles are functions of «What the app can do»
 * (src/lib/features.js): their name and page come from there. Everything is a suggestion: the order can change
 * (arrows and drag), a tile can be hidden (Undo) and shown again, «As at the start» resets. Pure; the card is
 * src/lib/ui/AllHere.svelte, tested in tests/alleshier.test.js.
 */
import { FEATURES } from './features.js';

/** The functions of each area, in their first order (feature ids). One PR per area adds its list. */
export const ALL_HERE = {
  bikes: ['f.partwear', 'f.inspect', 'f.workshop', 'f.spick', 'f.workshoprounds', 'f.sparestock', 'f.wearphotos', 'f.bikeseason', 'f.bikeyear', 'f.sellbike', 'f.bikebox', 'f.velofaq', 'f.strava', 'f.kmimport', 'f.velosetup', 'f.bagplan', 'f.setuplog', 'f.equipment', 'f.bikecompare', 'f.measure'],
};

/** The settings key of an area: { order: [ids], hidden: [ids] }. */
export const allHereKey = (area) => `alleshier.${area}`;

const BY_ID = Object.fromEntries(FEATURES.map((f) => [f.id, f]));

/** The tile of a function: its id, English title (for t()) and page. Null when it has no fixed page. */
export function tileOf(id) {
  const f = BY_ID[id];
  if (!f?.href || f.href.includes('{')) return null;
  return { id, title: f.title, href: f.href };
}

/** The tiles of an area as the user arranged them: { all (ids, hidden ones at their place), shown, hidden }. Unknown ids are left out, new ones go last. */
export function arrange(area, state = null) {
  const ids = (ALL_HERE[area] ?? []).filter((id) => tileOf(id));
  const order = (state?.order ?? []).filter((id) => ids.includes(id));
  const all = [...order, ...ids.filter((id) => !order.includes(id))];
  const hidden = new Set((state?.hidden ?? []).filter((id) => ids.includes(id)));
  return { all, shown: all.filter((id) => !hidden.has(id)).map(tileOf), hidden: all.filter((id) => hidden.has(id)).map(tileOf) };
}

/** The state after moving a shown tile one place up (-1) or down (+1). */
export function step(area, state, id, dir) {
  const { shown, hidden } = arrange(area, state);
  const ids = shown.map((x) => x.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return state;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return { order: [...ids, ...hidden.map((x) => x.id)], hidden: hidden.map((x) => x.id) };
}

/** The state after dragging a shown tile from place «from» to place «to». */
export function moveTo(area, state, from, to) {
  const { shown, hidden } = arrange(area, state);
  const ids = shown.map((x) => x.id);
  if (from < 0 || from >= ids.length || to < 0 || to >= ids.length) return state;
  const [x] = ids.splice(from, 1);
  ids.splice(to, 0, x);
  return { order: [...ids, ...hidden.map((h) => h.id)], hidden: hidden.map((h) => h.id) };
}

/** The state after hiding (true) or showing (false) a tile. */
export function setHidden(area, state, id, hide) {
  const { all: order, hidden } = arrange(area, state);
  const h = new Set(hidden.map((x) => x.id));
  if (hide) h.add(id);
  else h.delete(id);
  return { order, hidden: order.filter((x) => h.has(x)) };
}
