/**
 * «Form im Vergleich zu früher» (Noah 21.11.2026, Klügere Auswertungen K2): the same months (May to October) of
 * this year against the years before, from what the app already holds. Watt per heartbeat (average watts divided
 * by average pulse) of the bike rides with a power meter, the middle value of the window; next to it the middle
 * resting pulse and the hours of training. Days with a marker (K1: sick, injured, stress, holiday) are left out
 * of the rides and the resting pulse. Rules and statistics only, no AI, no diagnosis. Pure; tests/form-vergleich.test.js.
 */

/** The months compared: May to October. */
export const MONTHS = [5, 10];
/** Defaults, the person can change the first two («So gerechnet»). */
export const DEFAULTS = { minRides: 10, minMin: 40 };
/** A year further than this away from the middle of all years is called an outlier (a data problem, not form). */
export const OUTLIER = 0.2;
/** A change smaller than this does not count as a direction. */
export const STEP = 0.02;
/** At least this many days with a resting pulse for a middle value. */
export const MIN_RHR_DAYS = 20;

export const SETTINGS_KEY = 'training.vergleich';

/** The settings row as numbers in a sensible range; anything else falls back to the defaults. */
export function cleanSettings(v) {
  const n = (x, lo, hi, d) => (Number.isFinite(x) && x >= lo && x <= hi ? Math.round(x) : d);
  return { minRides: n(v?.minRides, 3, 60, DEFAULTS.minRides), minMin: n(v?.minMin, 10, 240, DEFAULTS.minMin) };
}

const median = (list) => {
  const v = list.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

/** Is the day inside the window of its year (May 1 to October 31, for the current year up to today)? */
export function inWindow(day, today) {
  const y = Number(day.slice(0, 4));
  const md = day.slice(5);
  const lo = `${String(MONTHS[0]).padStart(2, '0')}-01`;
  const hi = `${String(MONTHS[1]).padStart(2, '0')}-31`;
  if (md < lo || md > hi) return false;
  if (y === Number(today.slice(0, 4)) && day > today) return false;
  return true;
}

/** Watt per heartbeat of one activity, or null when it is not a bike ride with a power meter, a pulse and enough time. */
export function wattPerBeat(a, minMin = DEFAULTS.minMin) {
  if (a?.kind !== 'bike' || !a.wDevice) return null;
  if (!(a.wAvg > 0) || !(a.hrAvg > 0)) return null;
  if (!((a.movingS ?? 0) >= minMin * 60)) return null;
  return a.wAvg / a.hrAvg;
}

/**
 * The comparison.
 * table: Map day → { rhr, acts }; marked: Set of days to leave out (markedDays of K1).
 * → { level: 'few' | 'trend' | 'sure', years: [{ year, rides, wpb, rhr, rhrDays, hours, outlier }] (oldest first),
 *     cur, prev, dir: 1 | -1 | 0 (current against the year before) }
 */
export function compareYears({ table, today, marked = new Set(), settings = DEFAULTS }) {
  const s = cleanSettings(settings);
  const by = new Map();
  const at = (y) => {
    if (!by.has(y)) by.set(y, { year: y, w: [], rhr: [], sec: 0 });
    return by.get(y);
  };
  for (const [day, row] of table ?? []) {
    if (!inWindow(day, today)) continue;
    const y = at(Number(day.slice(0, 4)));
    for (const a of row.acts ?? []) y.sec += a.movingS ?? 0;
    if (marked.has(day)) continue;
    if (Number.isFinite(row.rhr)) y.rhr.push(row.rhr);
    for (const a of row.acts ?? []) {
      const w = wattPerBeat(a, s.minMin);
      if (w != null) y.w.push(w);
    }
  }
  const years = [...by.values()]
    .sort((a, b) => a.year - b.year)
    .map((y) => ({
      year: y.year,
      rides: y.w.length,
      wpb: y.w.length >= s.minRides ? median(y.w) : null,
      rhr: y.rhr.length >= MIN_RHR_DAYS ? median(y.rhr) : null,
      rhrDays: y.rhr.length,
      hours: y.sec / 3600,
      outlier: false,
    }));
  const valid = years.filter((y) => y.wpb != null);
  const mid = median(valid.map((y) => y.wpb));
  for (const y of valid) y.outlier = valid.length >= 3 && mid > 0 && Math.abs(y.wpb - mid) / mid > OUTLIER;
  const curYear = Number(today.slice(0, 4));
  const cur = years.find((y) => y.year === curYear) ?? null;
  const prev = [...years].reverse().find((y) => y.year < curYear && y.wpb != null) ?? null;
  const base = { years, cur, prev, dir: 0, level: 'few' };
  if (!cur || cur.wpb == null || !prev || valid.some((y) => y.outlier)) return base;
  const rel = (cur.wpb - prev.wpb) / prev.wpb;
  base.dir = Math.abs(rel) < STEP ? 0 : rel > 0 ? 1 : -1;
  base.level = 'trend';
  // «sure»: this year and the two years before it (in a row) all moved the same way, each step at least STEP
  const y1 = years.find((y) => y.year === curYear - 1);
  const y2 = years.find((y) => y.year === curYear - 2);
  if (y1?.wpb != null && y2?.wpb != null && base.dir !== 0) {
    const d1 = (y1.wpb - y2.wpb) / y2.wpb;
    if (Math.abs(d1) >= STEP && Math.sign(d1) === base.dir) base.level = 'sure';
  }
  return base;
}
