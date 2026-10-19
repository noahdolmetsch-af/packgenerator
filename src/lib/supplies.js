/**
 * Paket H «Packen leichter», answer 2 «2b» (Noah 19.10.2026 12:09): supplies with an expiry date.
 * a) an expiry date per item and a reminder 2 weeks before (push kind 'supply', schedule.js);
 * b) the app counts the stock and puts «buy again» on the shopping list when it runs low or expired.
 *
 * Fields on a gear item (all optional, nothing is required):
 *   expires   'YYYY-MM-DD'  best before / use by
 *   stock     number        how many you have at home now
 *   minStock  number        buy again below this (empty: 1 when the stock is counted)
 *   rebuy     true          put on the shopping list by hand
 * Food & drink always counts as a supply; any other item becomes one as soon as one field is set
 * (gels, medicines, gas cartridges, batteries …).
 */
import { isConsumable } from './gear.js';
import { localDay } from './localday.js';

/** The reminder comes this many days before the expiry date (answer 2a: 2 weeks). */
export const EXPIRY_WARN_DAYS = 14;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const dayMs = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
/** Whole calendar days from today to the date (negative: past). */
export const daysUntil = (day, today = localDay()) => (DAY.test(day ?? '') ? Math.round((dayMs(day) - dayMs(today)) / 864e5) : null);

export const hasStock = (i) => Number.isFinite(i?.stock);
export const isSupply = (i) => !!i && i.ownership !== 'gone' && (isConsumable(i) || DAY.test(i.expires ?? '') || hasStock(i) || Number.isFinite(i.minStock) || i.rebuy === true);

/** 'expired' | 'soon' (within 2 weeks) | 'ok' | null (no date). */
export function expiryState(i, today = localDay()) {
  const d = daysUntil(i?.expires, today);
  if (d == null) return null;
  if (d < 0) return 'expired';
  if (d <= EXPIRY_WARN_DAYS) return 'soon';
  return 'ok';
}

/** The stock below which it goes on the shopping list. */
export const minOf = (i) => (Number.isFinite(i?.minStock) ? i.minStock : 1);

/** Why an item is on the shopping list: 'hand' | 'empty' | 'low' | 'expired' | null. */
export function buyReason(i, today = localDay()) {
  if (!i || i.ownership === 'gone') return null;
  if (i.rebuy === true) return 'hand';
  if (hasStock(i) && i.stock <= 0) return 'empty';
  if (hasStock(i) && i.stock < minOf(i)) return 'low';
  if (expiryState(i, today) === 'expired') return 'expired';
  return null;
}

/** How many to buy: up to the minimum (at least 1). */
export const buyQty = (i) => Math.max(1, minOf(i) - (hasStock(i) ? Math.max(0, i.stock) : 0));

/** The shopping list of supplies: [{ item, reason, qty }], the empty ones first. */
export function rebuyList(items = [], today = localDay()) {
  const order = { empty: 0, expired: 1, low: 2, hand: 3 };
  return items
    .map((item) => ({ item, reason: buyReason(item, today) }))
    .filter((r) => r.reason)
    .map((r) => ({ ...r, qty: buyQty(r.item) }))
    .sort((a, b) => order[a.reason] - order[b.reason] || String(a.item.name).localeCompare(String(b.item.name), 'de'));
}

/** Supplies that expire soon or have expired, soonest first: [{ item, days, state }]. */
export function expiringSoon(items = [], today = localDay()) {
  return items
    .filter((i) => i.ownership !== 'gone')
    .map((item) => ({ item, days: daysUntil(item.expires, today), state: expiryState(item, today) }))
    .filter((r) => r.state === 'soon' || r.state === 'expired')
    .sort((a, b) => a.days - b.days);
}

/** «Bought»: the stock goes up by n, the hand mark goes; an expired date is cleared (the new pack has its own). */
export function bought(i, n = buyQty(i), today = localDay()) {
  const next = { ...i, stock: (hasStock(i) ? Math.max(0, i.stock) : 0) + n };
  delete next.rebuy;
  if (expiryState(i, today) === 'expired') next.expires = null;
  return next;
}

/** Used one up (on a trip or at home): the stock goes down by one, never below 0. */
export const usedOne = (i) => ({ ...i, stock: Math.max(0, (hasStock(i) ? i.stock : 1) - 1) });

/** The date the expiry reminder comes (2 weeks before; today when that day has passed). */
export function remindDay(i, today = localDay()) {
  if (!DAY.test(i?.expires ?? '')) return null;
  const d = new Date(`${i.expires}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - EXPIRY_WARN_DAYS);
  const day = d.toISOString().slice(0, 10);
  return day < today ? today : day;
}
