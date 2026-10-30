/**
 * «Analyse» (Noah 27.10.2026, thread «Analyse-Tool für alle Daten», answers «1a 2a 3a 4a 5b»): one page in
 * Auswerten that shows every value the app has, from Fitbit, Strava, your body entries, «Wi gaht's?» and
 * every activity you tick in Aktiv, each as a tile with a small course. A tap opens the value's own page
 * (Körperwerte, a sport, or «Haken ausgewertet» for an activity; «2a»: no second page for the same).
 * Only to look at: no grades. Pure rules (no database, no clock): days are 'YYYY-MM-DD'.
 */

/** The periods of the page in days; 365 is the year. */
export const PERIODS = [7, 30, 90, 365];
export const DEFAULT_PERIOD = 30;

/** The sources a user can switch on and off, in the order of the chips. */
export const SOURCES = ['aktiv', 'fitbit', 'strava', 'body', 'check'];

/** The source chip of a value of uebersicht.js BODY (its `src`). */
export function sourceOf(src) {
  if (src === 'fitbit') return 'fitbit';
  if (src === 'strava' || src === 'zones' || src === 'temp') return 'strava';
  if (src === 'check' || src === 'ab') return 'check';
  if (src === 'med') return 'aktiv';
  return 'body'; // own entries and what the app counts (readiness)
}

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The days of a period that ends `to`, oldest first. */
export function periodDays(to, n) {
  return Array.from({ length: n }, (_, i) => addDays(to, i - n + 1));
}

/**
 * The summary of one value over the days: the total (for values that add up: steps, km, ticks) or the
 * mean of the days that have one, and how many days have one. → { value, n }
 */
export function summaryOf(values = [], sum = false) {
  const vals = values.map(fin).filter((v) => v != null);
  if (!vals.length) return { value: null, n: 0 };
  const total = vals.reduce((a, b) => a + b, 0);
  return { value: sum ? total : total / vals.length, n: vals.length };
}

/**
 * The small course of a tile: at most `max` points, each the total (sum) or the mean of its days; a
 * point without any value stays null (a gap). Oldest first.
 */
export function sparkOf(values = [], sum = false, max = 30) {
  const size = Math.max(1, Math.ceil(values.length / max));
  const out = [];
  for (let i = 0; i < values.length; i += size) {
    const part = values.slice(i, i + size).map(fin).filter((v) => v != null);
    out.push(part.length ? (sum ? part.reduce((a, b) => a + b, 0) : part.reduce((a, b) => a + b, 0) / part.length) : sum ? 0 : null);
  }
  return out;
}

/**
 * The tiles of the page. groups: [{ key, name, items: [{ key, name, src, sum, get(day) → number|null,
 * href, unit }] }]; days: the days of the period; on: the switched-on sources. A value without any day in
 * the period is left out, so is a group without a tile.
 * → [{ key, name, tiles: [{ ...item, value, n, spark }] }]
 */
export function tilesOf(groups = [], days = [], on = SOURCES, { all = false } = {}) {
  const out = [];
  for (const g of groups) {
    const tiles = [];
    for (const it of g.items ?? []) {
      if (!on.includes(it.src)) continue;
      // a value the app cannot get yet (only a place holder) shows only with «all»
      if (it.later) {
        if (all) tiles.push({ ...it, value: null, n: 0, spark: [], empty: true });
        continue;
      }
      const values = days.map((d) => fin(it.get?.(d)));
      const s = summaryOf(values, !!it.sum);
      if (!s.n) {
        if (all) tiles.push({ ...it, value: null, n: 0, spark: [], empty: true });
        continue;
      }
      const spark = typeof it.profile === 'function' ? it.profile(days) : sparkOf(values, !!it.sum);
      tiles.push({ ...it, value: s.value, n: s.n, spark });
    }
    if (tiles.length) out.push({ key: g.key, name: g.name, tiles });
  }
  return out;
}

/**
 * «Alle Werte» (27.10.2026): the mean per hour of the day over the days (24 places, null = no value),
 * from Fitbit's hourly values (healthDays stepH or hrH). hoursOf(d) gives the 24 values of a day or null.
 */
export function hourProfile(days = [], hoursOf) {
  const sum = Array(24).fill(0);
  const n = Array(24).fill(0);
  for (const d of days) {
    const h = hoursOf?.(d);
    if (!Array.isArray(h)) continue;
    h.forEach((v, i) => {
      if (fin(v) == null || i > 23) return;
      sum[i] += v;
      n[i]++;
    });
  }
  return sum.map((v, i) => (n[i] ? v / n[i] : null));
}

/** Fitbit's «hourly activity»: of the 12 hours from 09 to 21 o'clock, how many had at least 250 steps; null without hours. */
export const ACTIVE_HOUR_STEPS = 250;
export function activeHours(stepH) {
  if (!Array.isArray(stepH)) return null;
  const part = stepH.slice(9, 21);
  if (!part.some((v) => fin(v) != null)) return null;
  return part.filter((v) => fin(v) != null && v >= ACTIVE_HOUR_STEPS).length;
}

/** The mean of the hours of a day that have a value, or null. */
export function meanOfHours(h) {
  const vals = Array.isArray(h) ? h.map(fin).filter((v) => v != null) : [];
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

/** The sum of the numbers of an object ({ light, mod, … }), or null without any. */
export function sumOf(o, keys = null) {
  if (!o || typeof o !== 'object') return null;
  const vals = (keys ?? Object.keys(o)).map((k) => fin(o[k])).filter((v) => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}

/** The ticks of one activity per day (Map day → count) from Aktiv's log. */
export function ticksByDay(log = [], actId) {
  const by = new Map();
  for (const e of log) {
    if (e?.actId !== actId || typeof e.day !== 'string') continue;
    by.set(e.day, (by.get(e.day) ?? 0) + 1);
  }
  return by;
}

/** The period of «Haken ausgewertet» that fits (30, 90 or 365 days). */
export const tickPeriod = (n) => (n >= 365 ? 365 : n > 30 ? 90 : 30);

/** The SVG points of a small course in a box w × h (null values leave a gap), as path data. */
export function sparkPath(spark = [], w = 100, h = 28) {
  const vals = spark.filter((v) => v != null);
  if (!vals.length) return '';
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i) => (spark.length > 1 ? (i / (spark.length - 1)) * w : w / 2);
  const y = (v) => (hi === lo ? h / 2 : h - 2 - ((v - lo) / span) * (h - 4));
  let d = '';
  let open = false;
  spark.forEach((v, i) => {
    if (v == null) {
      open = false;
      return;
    }
    d += `${open ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
    open = true;
  });
  return d;
}
