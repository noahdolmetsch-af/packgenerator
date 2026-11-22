/**
 * «Kursblick» (Noah 22.11.2026): the calculations of the small app, pure (no database, no screen, no clock).
 * A series is [[day, close], …] ascending, days as YYYY-MM-DD (calendar days of the market). Days are counted
 * on the date string (UTC calendar arithmetic), never with milliseconds from «now». Tested in tests/kurse.test.js.
 */

/** Grams in one troy ounce: gold is quoted per ounce, Noah wants Swiss francs per kilogram. */
export const OZ_G = 31.1034768;
/** The reference day (Noah 22.11.2026: «Kurs vom 1. November 2026»); a Sunday counts as the last close before it. */
export const REFERENZ_STANDARD = '2026-11-01';
/** The dealer's deduction in percent, a suggestion the user can change (Noah 22.11.2026 «4a»). */
export const ABSCHLAG_STANDARD = 2;
/** Suggestions for the form of the gold; every number can be changed. */
export const FORMEN = [
  { key: 'bar', abschlag: 2 },
  { key: 'coin', abschlag: 4 },
  { key: 'scrap', abschlag: 8 },
];

const dayOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '');
const utc = (day) => new Date(`${day}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);

/** `day` moved by n calendar days. */
export function addDays(day, n) {
  const d = utc(day);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

/** `day` moved by n months, a day that does not exist (31st) becomes the last day of that month. */
export function addMonths(day, n) {
  const d = utc(day);
  const dom = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dom, last));
  return iso(d);
}

/** The day `spec` before `day`. spec: { n, unit: 'd' | 'w' | 'm' | 'y' }. */
export function backBy(day, spec) {
  const n = Math.max(0, Math.round(Number(spec?.n) || 0));
  if (spec?.unit === 'w') return addDays(day, -7 * n);
  if (spec?.unit === 'm') return addMonths(day, -n);
  if (spec?.unit === 'y') return addMonths(day, -12 * n);
  return addDays(day, -n);
}

/** The ready-made periods (the user can add one of their own: number and unit). */
export const PERIODS = [
  { key: 'day', n: 1, unit: 'd', label: 'Previous day' },
  { key: 'week', n: 1, unit: 'w', label: 'Week' },
  { key: 'month', n: 1, unit: 'm', label: 'Month' },
  { key: 'quarter', n: 3, unit: 'm', label: '3 months' },
  { key: 'halfyear', n: 6, unit: 'm', label: '6 months' },
  { key: 'year', n: 1, unit: 'y', label: 'Year' },
  { key: 'y5', n: 5, unit: 'y', label: '5 years' },
  { key: 'y10', n: 10, unit: 'y', label: '10 years' },
  { key: 'y20', n: 20, unit: 'y', label: '20 years' },
  { key: 'y40', n: 40, unit: 'y', label: '40 years' },
];
export const periodOf = (key) => PERIODS.find((p) => p.key === key) ?? null;

/** The point on `day` or the last one before it, null when the series starts later. */
export function closeOnOrBefore(points, day) {
  if (!points?.length || !dayOk(day) || points[0][0] > day) return null;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (points[mid][0] <= day) lo = mid;
    else hi = mid - 1;
  }
  return points[lo];
}

/** USD per ounce → Swiss francs per kilogram (fx: francs per dollar). */
export const usdOzToChfKg = (usdOz, fx) => (usdOz / OZ_G) * 1000 * fx;

/** Gold in francs per kilogram for every day it traded; the dollar rate of that day or the last one before it. */
export function goldChfKg(gold, fx) {
  if (!gold?.length || !fx?.length) return [];
  const out = [];
  let j = -1;
  for (const [day, usd] of gold) {
    while (j + 1 < fx.length && fx[j + 1][0] <= day) j++;
    if (j < 0) continue;
    out.push([day, Math.round(usdOzToChfKg(usd, fx[j][1]) * 100) / 100]);
  }
  return out;
}

/** What a sale brings: price minus the dealer's deduction (percent, kept between 0 and 50) and a fixed fee. */
export function verkaufswert(price, abschlagPct = ABSCHLAG_STANDARD, gebuehr = 0) {
  const a = Math.min(50, Math.max(0, Number(abschlagPct) || 0));
  const fee = Math.max(0, Number(gebuehr) || 0);
  return Math.round((price * (1 - a / 100) - fee) * 100) / 100;
}

/**
 * The change from `fromDay` to the last point. from: the close on that day or the last before it; if the series
 * starts later, its first point and `kurz: true` (the history is shorter than asked, «Data since …»).
 */
export function vergleich(points, fromDay) {
  if (!points?.length) return null;
  const to = points[points.length - 1];
  let from = closeOnOrBefore(points, fromDay);
  let kurz = false;
  if (!from) {
    from = points[0];
    kurz = true;
  }
  if (from[0] >= to[0]) return { from, to, abs: 0, pct: 0, kurz };
  return { from, to, abs: to[1] - from[1], pct: ((to[1] - from[1]) / from[1]) * 100, kurz };
}

/** The change over a period (spec) counted back from the last day of the series. */
export const verglichenMit = (points, spec) => (points?.length ? vergleich(points, backBy(points[points.length - 1][0], spec)) : null);

/** A custom period from the fields, or null (a number from 1 to 999 and a unit). */
export function eigenerZeitraum(n, unit) {
  const k = Math.round(Number(n));
  if (!Number.isFinite(k) || k < 1 || k > 999 || !['d', 'w', 'm', 'y'].includes(unit)) return null;
  return { key: `own-${k}${unit}`, n: k, unit };
}

/** The part of a series from `fromDay` on, starting with the point on or before it (or the first point). */
export function ab(points, fromDay) {
  if (!points?.length) return [];
  const start = closeOnOrBefore(points, fromDay) ?? points[0];
  return points.slice(points.indexOf(start));
}

/** At most `max` points for a drawing: the first, the last and from every stretch the lowest and the highest. */
export function duenn(points, max = 240) {
  if (!points || points.length <= max) return points ?? [];
  const size = Math.ceil((points.length - 2) / Math.floor((max - 2) / 2));
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i += size) {
    const part = points.slice(i, Math.min(i + size, points.length - 1));
    let lo = part[0];
    let hi = part[0];
    for (const p of part) {
      if (p[1] < lo[1]) lo = p;
      if (p[1] > hi[1]) hi = p;
    }
    const two = lo[0] <= hi[0] ? [lo, hi] : [hi, lo];
    out.push(two[0]);
    if (two[1] !== two[0]) out.push(two[1]);
  }
  out.push(points[points.length - 1]);
  return out;
}
