/**
 * «Anprobe» (Noah 21.11.2026 «1-5a 4b», Weg A): #/wardrobe/tryon. Pick a temperature (today's ride, the next
 * tour or your own) and see the onion the wardrobe builds for it: one piece per place, a gap where nothing
 * fits, an arrow pair to swap a piece for the next one of that place. Nothing is saved until «Pack it for the tour».
 * Pure functions only (the page reads the database); the rules stay in wardrobe.js (onionRows) and
 * home/wearday.js (swapOptions, gapReason, fitOf).
 */
import { onionRows, felt, isClothing, everydayOnly } from './wardrobe.js';
import { swapOptions, gapReason, fitOf } from './home/wearday.js';
import { isInventory, itemWeight } from './gear.js';

/** The temperatures the slider offers (real °C). */
export const TRY_MIN = -15;
export const TRY_MAX = 30;
export const clampTemp = (c) => {
  const n = Math.round(Number(c));
  return Number.isFinite(n) ? Math.max(TRY_MIN, Math.min(TRY_MAX, n)) : null;
};

/**
 * The fitting on one temperature: { c (felt), real, wet, rows, weightG, count, gaps }.
 * real: the temperature you try (°C); offset: the learned shift plus your own «I get cold» (felt = real − offset);
 * picks: { [rowKey]: itemId } the pieces you chose instead of the app's; wet: rain on the way.
 * Each row: { key, name, rain, item (the piece shown, or null), auto (it is the app's choice), fit
 * ('ok' | 'light' | 'warm' | null), options (swapOptions: every riding piece of the place), index (of item in
 * options, −1 for none), gap (why nothing fits: gapReason, null when a piece is shown) }.
 */
export function tryOn(items = [], real, { wet = false, offset = 0, rule = null, picks = {} } = {}) {
  const c = felt(real, offset);
  const own = items.filter((i) => isInventory(i) && isClothing(i) && !everydayOnly(i));
  const rows = onionRows(own, c, wet, rule).map((r) => {
    const options = swapOptions(r.key, items, c, rule?.prefer);
    const picked = picks[r.key] ? options.find((o) => o.item.id === picks[r.key])?.item ?? null : null;
    const item = picked ?? r.item;
    return {
      key: r.key,
      name: r.name,
      rain: r.rain,
      item,
      auto: !picked,
      fit: item ? fitOf(item, c) : null,
      options,
      index: item ? options.findIndex((o) => o.item.id === item.id) : -1,
      gap: item ? null : gapReason(r.key, items, c, { rain: r.rain }),
    };
  });
  const shown = rows.map((r) => r.item).filter(Boolean);
  return {
    c,
    real,
    wet,
    rows,
    count: shown.length,
    gaps: rows.length - shown.length,
    weightG: shown.reduce((s, i) => s + (itemWeight(i) ?? 0), 0),
  };
}

/** The id of the next (dir 1) or previous (dir −1) piece of a row; round and round. null: nothing to swap to. */
export function stepPick(row, dir) {
  const n = row.options.length;
  if (!n || (n === 1 && row.index === 0)) return null;
  const at = row.index < 0 ? (dir > 0 ? 0 : n - 1) : (row.index + dir + n) % n;
  return row.options[at].item.id;
}

/** The entries to add to a trip for the pieces shown: the ones not on the list yet, worn (slot body). */
export function packEntries(trip, rows = []) {
  const have = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const ids = [];
  for (const r of rows) if (r.item && !have.has(r.item.id) && !ids.includes(r.item.id)) ids.push(r.item.id);
  return { ids, entries: [...(trip?.entries ?? []), ...ids.map((itemId) => ({ itemId, slot: 'body', qty: 1, packed: false }))] };
}
