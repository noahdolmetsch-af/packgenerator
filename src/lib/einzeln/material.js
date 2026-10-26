/**
 * Einzelideen Material (996 Ideen, Noah 25.10.2026: build 19, 20, 24; 21 and 22 wait for a mockup). Pure helpers, no database;
 * tested in tests/einzeln-material.test.js.
 *  19 «Warum Favorit?»: a short reason for a favourite (comfortable, reliable, within reach …) that shows
 *     again when you swap or replace it (SwapSheet, the wish that replaces it).
 *  20 «Upgrade nach gelöstem Ärger»: a wish also counts for the trouble it solves, not only for grams.
 *  24 «Leergewicht und Füllung»: the weight of an item is its empty weight; what goes in (water, gas,
 *     food) is item.fillG apart, so a trip shows the content on its own line.
 * Texts are English keys for t(); German in i18n/de/einzeln.js.
 */

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
