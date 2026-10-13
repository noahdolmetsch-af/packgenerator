/**
 * v0.124.0 A-J1 «Ein Weg zum Erfassen» (mockup A-J1, Noah 13.10.2026 «aj-aj5 ok», answer 1a):
 * «New › Workshop visit» opens the real visit window, with the km and the last workshop filled in.
 * Everything is a suggestion: the window shows where each value comes from and any field can be changed.
 * Pure functions only, tested in tests/visitprefill.test.js.
 */
import { kmOn } from './kmbook.js';
import { shopsOf } from './inbox.js';

/**
 * What the visit window suggests for one bike on one day.
 * - km: the bike's km on that day from the km book (kmOn); with no entry in the book and the day being
 *   today, the bike's counter (bike.km). kmFrom: 'book' | 'counter' | null.
 * - shop: the shop of the bike's newest visit, else of the newest visit of any bike; shopDate its date.
 * - shops: the known shops (most often first, at most 4), each with last: true for the suggested one.
 * → { km, kmFrom, shop, shopDate, shops }
 */
export function visitPrefill({ bike = null, date, today, entries = [], visits = [] }) {
  let km = bike && date ? kmOn(entries, bike.id, date) : null;
  let kmFrom = km != null ? 'book' : null;
  if (km == null && bike && date === today && typeof bike.km === 'number') {
    km = Math.round(bike.km);
    kmFrom = 'counter';
  }
  const newest = (list) => [...list].filter((v) => v.shop).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0] ?? null;
  const last = newest(visits.filter((v) => bike && v.bikeId === bike.id)) ?? newest(visits);
  const shop = last?.shop ?? '';
  const shops = shopsOf(visits)
    .slice(0, 4)
    .map((s) => ({ ...s, last: s.shop === shop }));
  if (shop && !shops.some((s) => s.last)) shops.unshift({ shop, n: 1, last: true });
  return { km, kmFrom, shop, shopDate: last?.date ?? null, shops };
}

/**
 * A hint «… is now here» for a moved entry, shown for `days` days from the first time it was seen
 * (A-J1: «Report a problem» left Me). since: the first day it was shown ('YYYY-MM-DD') or null.
 * → { show, since } (since: the day to remember).
 */
export function movedHint(since, today, days = 30) {
  const first = /^\d{4}-\d{2}-\d{2}$/.test(since ?? '') ? since : today;
  const ms = Date.parse(`${today}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`);
  return { show: ms >= 0 && Math.round(ms / 864e5) < days, since: first };
}
