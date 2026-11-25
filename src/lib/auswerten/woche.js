/**
 * «Auswerten neu» Teil 2, Reiter «Woche» (Noah 24.11.2026 «1b 2a 3b 4a 5a», Entwurf B «Wochenbericht»): what you did in a week,
 * a month or a year, and how you recovered in it, against YOUR OWN usual range. Pure functions; the page is
 * src/pages/AuswertenWoche.svelte. The hours come from the same units as the Sports year (flow/einheiten.js, sportjahr.js).
 * Observation only: where a value stood, never why.
 */
import { addDays } from '../health.js';
import { rangeOf, STEPPED } from '../flow/zeitraum.js';
import { normalOf, placeIn, valuesOf, NORMAL_KEYS } from './normal.js';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const median = (s) => {
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
/** Fewer days with a value than this: no middle for the period (a single night says little). */
export const MIN_DAYS = 3;

/** The period one step before the shown one ({ from, to }), null for «All» and an own range. */
export function prevRange(period, today) {
  if (!STEPPED.includes(period.mode)) return null;
  const r = rangeOf({ ...period, back: (period.back ?? 0) + 1 }, today);
  return { from: r.from, to: r.to };
}

/** The change of a number against the one before in whole percent (+/−), null without a base. */
export function changePct(now, before) {
  if (!(before > 0) || !Number.isFinite(now)) return null;
  return Math.round((now / before - 1) * 100);
}

/**
 * The middle of HRV, resting pulse and sleep in the days from..to, against the own usual range of the 12 months before the end of the period:
 * [{ key, median, n, normal, place }] for every value with at least MIN_DAYS days; place 'below' | 'usual' | 'above' | null.
 */
export function periodRecovery(table, win, today) {
  const end = win.to < today ? win.to : today;
  const out = [];
  for (const key of NORMAL_KEYS) {
    const v = valuesOf(table, key, win.from, win.to);
    if (v.length < MIN_DAYS) continue;
    const m = median(v);
    const normal = normalOf(table, key, addDays(end, 1));
    out.push({ key, median: m, n: v.length, normal, place: normal ? placeIn(normal, m) : null });
  }
  return out;
}

/** The longest units of a list (most minutes first), at most n; a unit without minutes is left out. */
export function longest(units = [], n = 3) {
  return units
    .filter((u) => fin(Number(u.min)) > 0)
    .sort((a, b) => Number(b.min) - Number(a.min) || b.day.localeCompare(a.day))
    .slice(0, n);
}
