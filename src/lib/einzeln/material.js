/**
 * Einzelideen Material (996 Ideen, Noah 25.10.2026: build 19, 20, 21, 22, 24). Pure helpers, no database;
 * tested in tests/einzeln-material.test.js.
 *  19 «Warum Favorit?»: a short reason for a favourite (comfortable, reliable, within reach …) that shows
 *     again when you swap or replace it (SwapSheet, the wish that replaces it).
 *  20 «Upgrade nach gelöstem Ärger»: a wish also counts for the trouble it solves, not only for grams.
 *  21 «Zu viel an derselben Stelle»: the layer check also finds two pieces with the same task on a trip
 *     and asks what for (a spare on purpose, or one stays at home).
 *  22 «Kategorien als Ansichten»: own views of Material (Repair, Winter, Always along …); an item shows in
 *     several of them without a copy (item.ownViews). Views can be added, renamed, sorted and deleted.
 *  24 «Leergewicht und Füllung»: the weight of an item is its empty weight; what goes in (water, gas,
 *     food) is item.fillG apart, so a trip shows the content on its own line.
 * Texts are English keys for t(); German in i18n/de/einzeln.js.
 */
import { kindsOf, addKind } from '../ruhig/kinds.js';
import { zoneGroup, layerKey, rainProof } from '../wardrobe.js';

/* ---------- 19 Warum Favorit? ---------- */

/** The quick reasons a tap adds to «Why it is a favourite» (English keys for t()). */
export const FAV_WHY = ['Comfortable|why', 'Reliable|why', 'Within reach|why', 'Light|why', 'Warm|why', 'Packs small|why'];

/** The note with one more reason, «Reliable · Warm»; a reason already in it stays once. */
export function addWhy(note, word) {
  const parts = String(note ?? '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const w = String(word ?? '').trim();
  if (!w || parts.some((p) => p.toLowerCase() === w.toLowerCase())) return parts.join(' · ');
  return [...parts, w].join(' · ').slice(0, 120);
}
/** Why a favourite is one ('' when it is none or has no reason). */
export const favWhy = (item) => (item?.favorite && String(item.favNote ?? '').trim() ? String(item.favNote).trim() : '');

/* ---------- 20 Upgrade nach gelöstem Ärger ---------- */

/** The troubles a wish can solve (key: stored on the item, name: English key for t()). */
export const SOLVES = [
  { key: 'dry', name: 'Stays dry|solves' },
  { key: 'chargers', name: 'Fewer chargers|solves' },
  { key: 'warm', name: 'Warmer|solves' },
  { key: 'comfort', name: 'More comfort|solves' },
  { key: 'safe', name: 'Safer|solves' },
  { key: 'time', name: 'Less fiddling|solves' },
];
const SOLVE_KEYS = SOLVES.map((s) => s.key);
/** The troubles a wish solves, in the order of SOLVES (unknown keys left out). */
export const solvesOf = (item) => SOLVE_KEYS.filter((k) => (item?.solves ?? []).includes(k));
/** One trouble ticked or unticked. */
export const toggleSolve = (list, key) => {
  const has = (list ?? []).includes(key);
  return SOLVE_KEYS.filter((k) => (k === key ? !has : (list ?? []).includes(k)));
};
/** Points a solved trouble adds to the order of the wishlist (as much as a gap in the wardrobe at two). */
export const SOLVE_POINTS = 4;
export const solveScore = (item) => Math.min(2, solvesOf(item).length) * SOLVE_POINTS;

/* ---------- 21 Zu viel an derselben Stelle ---------- */

const band = (i) => (typeof i.tempMin === 'number' ? `t${Math.round(i.tempMin / 5)}` : i.tempClass ? `c${i.tempClass}` : '');

/**
 * Pieces on a trip with the same task: the same body zone and layer, both rain-proof or both not, and the
 * same warmth (lower border within the same 5 °C or the same class). → [{ key, zone, layer, items }],
 * at least two items each; groups the trip keeps on purpose (trip.twiceOk) are left out.
 */
export function twiceOf(trip, items = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const ok = new Set(trip?.twiceOk ?? []);
  const groups = new Map();
  const seen = new Set();
  for (const e of trip?.entries ?? []) {
    const i = byId.get(e.itemId);
    if (!i || seen.has(i.id)) continue;
    seen.add(i.id);
    const zone = zoneGroup(i.zone);
    const layer = layerKey(i.layer);
    if (!zone || !layer) continue;
    const key = `${zone}|${layer}|${rainProof(i) ? 'rain' : 'dry'}|${band(i)}`;
    if (!groups.has(key)) groups.set(key, { key, zone, layer, items: [] });
    groups.get(key).items.push(i);
  }
  return [...groups.values()].filter((g) => g.items.length >= 2 && !ok.has(g.key));
}
/** The trip with a group kept on purpose («both along on purpose»). */
export const keepTwice = (trip, key) => ({ twiceOk: [...new Set([...(trip?.twiceOk ?? []), key])] });

/* ---------- 22 Kategorien als Ansichten ---------- */

/** db.settings key of the own views ([{ id, std } | { id, name }], kinds.js). */
export const VIEWS_KEY = 'gear.ownViews';
/** The views a new app starts with (English keys for t()); each can be renamed or deleted. */
export const STD_VIEWS = [
  { id: 'repair', std: 'Repair|view' },
  { id: 'winter', std: 'Winter|view' },
  { id: 'always', std: 'Always along|view' },
];
export const ownViewsOf = (value) => kindsOf(value, STD_VIEWS);
export const addOwnView = (views, name) => addKind(views, name);
/** Is the item in this view? */
export const inOwnView = (item, id) => !!id && (item?.ownViews ?? []).includes(id);
/** How many items are in each view: { id: n }. */
export function ownViewCounts(items = [], views = []) {
  const out = Object.fromEntries(views.map((v) => [v.id, 0]));
  for (const i of items) for (const id of i.ownViews ?? []) if (id in out) out[id]++;
  return out;
}
/** The item's views with one view ticked or unticked (views: the list, for its order). */
export function toggleOwnView(list, id, views = []) {
  const has = (list ?? []).includes(id);
  const next = has ? (list ?? []).filter((x) => x !== id) : [...(list ?? []), id];
  const order = views.map((v) => v.id);
  return [...new Set(next)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
/**
 * A deleted view: its items leave it (the items themselves stay); with `to` they show in that view
 * instead. → the changed items (only those that change).
 */
export function dropOwnView(items = [], from, to = null, now = new Date().toISOString()) {
  return items
    .filter((i) => (i.ownViews ?? []).includes(from))
    .map((i) => {
      const rest = i.ownViews.filter((x) => x !== from);
      const next = to && !rest.includes(to) ? [...rest, to] : rest;
      return { ...i, ownViews: next, updatedAt: now };
    });
}

/* ---------- 24 Leergewicht und Füllung ---------- */

/** The content of one piece when full, in grams (null: none given). */
export const fillOf = (item) => (Number(item?.fillG) > 0 ? Math.round(Number(item.fillG)) : null);
/** Empty weight plus content of one piece (null when it is not weighed). */
export const fullOf = (item) => (item?.weightG == null ? null : item.weightG + (fillOf(item) ?? 0));
/**
 * The content of everything on a trip that has an empty weight and a content: { g, n } (n: items).
 * Items already counted as food or water (water in it, a food category) stay out: they are counted there.
 */
export function tripFill(entries = [], itemsById = {}, eats = () => false) {
  let g = 0;
  let n = 0;
  for (const e of entries) {
    const i = itemsById[e.itemId];
    const f = fillOf(i);
    if (!f || eats(i)) continue;
    g += f * (Number(e.qty) || 1);
    n++;
  }
  return { g, n };
}
