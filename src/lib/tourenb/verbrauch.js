/**
 * Idee 58 «Verbrauch buchen» (Touren b, Noah 26.10.2026 «freigabe», answer a: the stock and the shopping list
 * follow). What was used up or bought on the way, kept on the trip:
 *   trip.used   = { [itemId]: n }                               used up of what was taken
 *   trip.bought = [{ id, name, qty, chf, itemId? }]             bought on the way (name as typed, never t())
 *   trip.usedBooked = { at, stock: { [itemId]: before }, costIds: [id], opts }   once «Buchen» ran (for Undo)
 * «Buchen» (each part can be switched off): the stock at home goes down by what was used (items with a counted
 * stock only), so supplies.js puts what runs low on the shopping list; the bought things become expenses of the
 * tour (Ich › Werkzeugkasten › Tourkosten); the next packing list shows «Letztes Mal: 5 von 8» as a hint.
 * Pure functions, tested in tests/touren-b.test.js.
 */
import { isConsumable } from '../gear.js';
import { hasStock, minOf } from '../supplies.js';

const int = (v) => Math.max(0, Math.round(Number(v) || 0));
const qtyOf = (e) => Math.max(1, int(e?.qty) || 1);

/** Is the item one whose use can be counted? Food and drink and every supply with a stock or a minimum. */
export const countable = (i) => !!i && (isConsumable(i) || hasStock(i) || Number.isFinite(i.minStock));

/** The rows of a trip: [{ item, taken, used, left }] in list order, one per item. */
export function usedRows(trip, itemsById = {}) {
  const used = trip?.used && typeof trip.used === 'object' ? trip.used : {};
  const out = [];
  const seen = new Set();
  for (const e of trip?.entries ?? []) {
    const item = itemsById[e.itemId];
    if (!item || seen.has(item.id) || !countable(item)) continue;
    seen.add(item.id);
    const taken = qtyOf(e);
    const u = Math.min(int(used[item.id]), 99);
    out.push({ item, taken, used: u, left: Math.max(0, taken - u) });
  }
  return out;
}

/** The used map with one changed count (0 takes the row out). */
export function setUsed(used, itemId, n) {
  const next = { ...(used && typeof used === 'object' ? used : {}) };
  const v = Math.min(int(n), 99);
  if (v) next[itemId] = v;
  else delete next[itemId];
  return next;
}

/** The bought list made safe. */
export function boughtOf(trip) {
  return (Array.isArray(trip?.bought) ? trip.bought : [])
    .filter((b) => b && b.id && String(b.name ?? '').trim())
    .map((b) => ({ id: String(b.id), name: String(b.name).trim().slice(0, 80), qty: Math.max(1, int(b.qty) || 1), chf: Number.isFinite(Number(b.chf)) && b.chf !== '' && b.chf != null ? Math.round(Number(b.chf) * 100) / 100 : null, ...(b.itemId ? { itemId: String(b.itemId) } : {}) }));
}

/**
 * What «Buchen» would do: { stock: [{ item, from, to }], shop: [item], costs: [bought with a price], hint: bool }.
 * Only items with a counted stock change; shop lists those that fall below their minimum.
 */
export function bookPlan(trip, itemsById = {}) {
  const stock = [];
  const shop = [];
  for (const r of usedRows(trip, itemsById)) {
    if (!r.used || !hasStock(r.item)) continue;
    const to = Math.max(0, r.item.stock - r.used);
    stock.push({ item: r.item, from: r.item.stock, to });
    if (to < minOf(r.item)) shop.push(r.item);
  }
  // bought things that are an item at home add to its stock
  for (const b of boughtOf(trip)) {
    const item = b.itemId ? itemsById[b.itemId] : null;
    if (!item || !hasStock(item)) continue;
    const row = stock.find((s) => s.item.id === item.id);
    if (row) row.to += b.qty;
    else stock.push({ item, from: item.stock, to: item.stock + b.qty });
  }
  // used up completely and not counted at home: on the shopping list too
  for (const r of usedRows(trip, itemsById)) if (r.used && !r.left && !hasStock(r.item)) shop.push(r.item);
  return { stock, shop: shop.filter((i) => !hasStock(i) || stock.find((s) => s.item.id === i.id)?.to < minOf(i)), costs: boughtOf(trip).filter((b) => b.chf != null && b.chf > 0), hint: usedRows(trip, itemsById).some((r) => r.used) };
}

/** The expenses for the tour costs (Werkzeugkasten › Tourkosten, tools/costs.js item shape). */
export const costItems = (costs, { day, now, me = 'me', ids }) =>
  costs.map((b, n) => ({ id: ids[n], what: b.qty > 1 ? `${b.name} × ${b.qty}` : b.name, amount: b.chf, cur: 'CHF', chf: b.chf, paidBy: me, for: [], day, addedAt: now, from: 'used' }));

/**
 * The hint for the next packing list: the newest earlier booked trip of the same type that used the item.
 * → { used, taken, days, title } or null
 */
export function lastUse(trips = [], trip, itemId) {
  const start = trip?.startDate ?? '9999';
  const dom = trip?.domain ?? 'bikepacking';
  const prev = trips
    .filter((x) => x && x.id !== trip?.id && x.usedBooked?.opts?.hint !== false && x.usedBooked && (x.domain ?? 'bikepacking') === dom && (x.startDate ?? '') <= start && int(x.used?.[itemId]))
    .sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))[0];
  if (!prev) return null;
  const e = (prev.entries ?? []).find((x) => x.itemId === itemId);
  return { used: int(prev.used[itemId]), taken: e ? qtyOf(e) : null, days: Math.max(1, int(prev.days) || 1), title: prev.title ?? '' };
}
