/**
 * «Ein Filter auf Touren» (Noah 26.11.2026 «Ja», Wahl «a»): the field and the four buttons on top (year, bike, kind, distance)
 * filter the list «Meine Touren» itself, there is no second result list and no second filter box. Pure rules; Trips.svelte holds the
 * state, TourBar.svelte draws.
 */
import { normFilter, kindOf } from './filter.js';
import { fold } from '../search.js';

/** The distance buttons: key → the km range of the list filter ([from, to), null = open). */
export const DISTS = [
  { key: 'short', name: 'under 30 km', km: [null, 30] },
  { key: 'mid', name: '30 to 80 km', km: [30, 80] },
  { key: 'long', name: 'over 80 km', km: [80, null] },
];

/** Which distance button is on for this filter (the km range of the filter equals one of them), or null. */
export function distKeyOf(filter) {
  const [lo, hi] = normFilter(filter).km;
  return DISTS.find((d) => d.km[0] === lo && d.km[1] === hi)?.key ?? null;
}

/** The filter with a distance button switched on, or off when it is on already. */
export function withDist(filter, key) {
  const f = normFilter(filter);
  const d = DISTS.find((x) => x.key === key);
  f.km = !d || distKeyOf(f) === key ? [null, null] : [...d.km];
  return f;
}

/** The years that have a trip or ride, newest first (rows: { start: 'YYYY-MM-DD' }). */
export const yearsOf = (rows = []) => [...new Set(rows.map((r) => String(r.start ?? '').slice(0, 4)).filter((y) => /^\d{4}$/.test(y)))].sort().reverse();

/** The range of one calendar year as a period { mode, from, to } (the current year stops today). */
export function yearPeriod(year, today) {
  const to = `${year}-12-31`;
  return { mode: 'pick', from: `${year}-01-01`, to: to > today ? today : to };
}

/** A test for the words: every word of the question is in one of the fields (no words: everything passes). */
export function hitOf(q) {
  const words = fold(q).trim().split(/\s+/).filter(Boolean);
  return (...fields) => {
    if (!words.length) return true;
    const hay = fold(fields.filter((x) => x != null).join(' '));
    return words.every((w) => hay.includes(w));
  };
}

/** The rows that fit the words of the field: every word is in the title, the bike or the day. bikeOf(row) → the bike's name. */
export function wordRows(rows = [], q = '', bikeOf = () => '') {
  const hit = hitOf(q);
  return rows.filter((r) => hit(r.title, bikeOf(r), r.start));
}

/** The kinds that exist in the rows (for the button «Kind»): [{ key, n }] in the order of `kinds`. */
export function kindCounts(rows = [], kinds = []) {
  const n = {};
  for (const r of rows) n[kindOf(r)] = (n[kindOf(r)] ?? 0) + 1;
  return kinds.filter((k) => n[k.key]).map((k) => ({ ...k, n: n[k.key] }));
}
