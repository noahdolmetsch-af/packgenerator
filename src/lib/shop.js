/**
 * v0.34.0 (L3, Noah 1a): the shopping list of a trip. The food and consumables on the trip
 * (isConsumable: category 'food', the same items tripStats counts as consumablesG) with their
 * amounts ("3 × Gel, 5 × Bar"), tickable and shareable as text.
 *
 * The ticks live on the trip (trip.shop = { [itemId]: true }); the items and the entries never
 * change. A tick of an item that left the trip stays stored but is not shown or counted.
 * Pure functions (no database, no screen), tested in tests/shop.test.js.
 */
import { isConsumable } from './gear.js';
import { t, nameOf } from './i18n.svelte.js';

/**
 * The rows: [{ itemId, name, qty, done }] in the order of the list, one row per item (the
 * amounts of an item that is in two places add up). An entry whose item is gone keeps its id as name.
 */
export function shopList(trip, itemsById = {}) {
  const ticks = trip?.shop ?? {};
  const rows = new Map();
  for (const e of trip?.entries ?? []) {
    const it = itemsById[e.itemId];
    if (!it || !isConsumable(it)) continue;
    const qty = Math.max(1, Number(e.qty) || 1);
    const row = rows.get(e.itemId);
    if (row) row.qty += qty;
    else rows.set(e.itemId, { itemId: e.itemId, name: nameOf(it) || e.itemId, qty, done: !!ticks[e.itemId] });
  }
  return [...rows.values()];
}

/** { total, done, open } of a list from shopList. */
export const shopCount = (rows = []) => {
  const done = rows.filter((r) => r.done).length;
  return { total: rows.length, done, open: rows.length - done };
};

/** The new trip.shop after ticking (or unticking) one item; the other ticks stay as they are. */
export function toggleShop(shop, itemId) {
  const next = { ...(shop ?? {}) };
  if (next[itemId]) delete next[itemId];
  else next[itemId] = true;
  return next;
}

/** "3 × Gel" (one piece: just the name). */
export const shopLine = (row) => (row.qty > 1 ? `${row.qty} × ${row.name}` : row.name);

/**
 * The list as text to send: a heading with the trip, then what is still to buy and, below,
 * what is already bought, so nothing is lost when it is pasted into a message.
 */
export function shopText(trip, rows = []) {
  const open = rows.filter((r) => !r.done);
  const done = rows.filter((r) => r.done);
  const lines = [t('Shopping list: {title}', { title: trip?.title ?? '' })];
  if (!rows.length) lines.push(t('Nothing to buy for this trip.'));
  for (const r of open) lines.push(`☐ ${shopLine(r)}`);
  if (done.length) {
    lines.push('', t('Already bought:'));
    for (const r of done) lines.push(`✓ ${shopLine(r)}`);
  }
  return lines.join('\n');
}
