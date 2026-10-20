/**
 * Strava-Analyse 1:1 (Noah 20.10.2026 «nimm das als vorlage und baue es 1:1 nach», ten screenshots of
 * Strava's activity page with the Sauce extension): the numbers behind the part «Analyse» of the tour page.
 * Pure functions, tested in tests/stravaana.test.js. Observation only.
 */
import { powerBounds, powerZoneSecs, zoneSecs, shiftDay } from '../training.js';

/** The rows of «Peak Power» (seconds, label number, unit). */
export const PEAK_SPANS = [
  [5, 5, 's'],
  [15, 15, 's'],
  [30, 30, 's'],
  [60, 1, 'min'],
  [120, 2, 'min'],
  [300, 5, 'min'],
  [600, 10, 'min'],
  [1200, 20, 'min'],
  [1800, 30, 'min'],
  [3600, 1, 'h'],
];

/** The names of the power zones as on Strava (English sources for t()). */
export const PZ_NAMES = ['Recovery|pz7', 'Endurance|pz7', 'Tempo|pz7', 'Threshold|pz7', 'VO2max|pz7', 'Anaerobic|pz7', 'Neuromuscular|pz7'];
/** The names of the heart rate zones as on Strava (Z1, Z2 without a name there; the app names them). */
export const HZ_NAMES = ['Recovery|hz5', 'Endurance|hz5', 'Tempo|hz5', 'Threshold|hz5', 'Anaerobic|hz5'];

const pos = (v) => (Number.isFinite(v) && v > 0 ? v : null);

/** The watts of a span from the curve, or null. */
export const peakOf = (a, span) => {
  const p = Array.isArray(a?.pCurve) ? a.pCurve.find((x) => Array.isArray(x) && x[0] === span) : null;
  return pos(p?.[1]) ?? (span === 1200 ? pos(a?.w20) : null);
};

/** The heart rate zones as rows: { z, name, from, to, s, pct } (Z5 first, as on Strava). */
export function hrZoneRows(a, bounds) {
  const secs = a?.hist && bounds ? zoneSecs(a.hist, bounds) : null;
  if (!secs) return null;
  const sum = secs.reduce((x, y) => x + y, 0);
  if (!(sum > 0)) return null;
  return secs
    .map((s, i) => ({ z: i + 1, name: HZ_NAMES[i], from: i === 0 ? null : bounds[i - 1], to: i === 4 ? null : bounds[i] - 1, s, pct: Math.round((s / sum) * 1000) / 10 }))
    .reverse();
}

/** The power zones as rows: { z, name, from, to, s, pct } (Z7 first). */
export function powerZoneRows(a, ftp) {
  const secs = powerZoneSecs(a?.pHist, ftp);
  const b = powerBounds(ftp);
  if (!secs || !b) return null;
  const sum = secs.reduce((x, y) => x + y, 0);
  if (!(sum > 0)) return null;
  return secs
    .map((s, i) => ({ z: i + 1, name: PZ_NAMES[i], from: i === 0 ? 0 : b[i - 1] + 1, to: i === 6 ? null : b[i], s, pct: Math.round((s / sum) * 100) }))
    .reverse();
}

/** The 25 W distribution: [{ w, s }] from 0 W up to the highest bin with time (from p25, else from the 10 W bins). */
export function dist25(a) {
  let bins = a?.p25 && typeof a.p25 === 'object' ? a.p25 : null;
  if (!bins && a?.pHist) {
    bins = {};
    for (const [w, s] of Object.entries(a.pHist)) {
      const b = Math.floor((Number(w) + 5) / 25) * 25;
      bins[b] = (bins[b] ?? 0) + Number(s);
    }
  }
  if (!bins) return null;
  const rows = Object.entries(bins).map(([w, s]) => [Number(w), Number(s) || 0]).filter(([w, s]) => w >= 0 && s > 0);
  if (!rows.length) return null;
  const top = Math.max(...rows.map((r) => r[0]));
  const by = new Map(rows);
  const out = [];
  for (let w = 0; w <= top; w += 25) out.push({ w, s: by.get(w) ?? 0 });
  return out;
}

/** The power curve of the ride and, as the grey area, the best of each span of the other rides in the `days` before. */
export function curveOf(a, acts = [], days = 42) {
  const mine = (Array.isArray(a?.pCurve) ? a.pCurve : []).filter((p) => Array.isArray(p) && p[1] > 0).sort((x, y) => x[0] - y[0]);
  if (mine.length < 2) return null;
  const from = shiftDay(a.day, -days);
  const best = new Map();
  for (const o of acts) {
    if (!o?.day || o.day < from || o.day > a.day || !Array.isArray(o.pCurve)) continue;
    for (const [s, w] of o.pCurve) if (w > 0 && w > (best.get(s) ?? 0)) best.set(s, w);
  }
  const grey = [...best.entries()].sort((x, y) => x[0] - y[0]);
  return { mine, grey: grey.length > 1 ? grey : [], from, to: a.day };
}

/* ---------- the analysis charts (ser: api/strava.js seriesOf) ---------- */

/** The usable series of an activity: { step, km, n, t, alt, spd (km/h), w, hr, cad, temp } or null. */
export function serOf(a) {
  const s = a?.ser;
  if (!s || !(Number(s.step) > 0) || !Array.isArray(s.t) || s.t.length < 2) return null;
  const n = s.t.length;
  const fit = (x) => (Array.isArray(x) && x.length === n ? x : null);
  const spd = fit(s.spd)?.map((v) => (Number.isFinite(v) ? v / 10 : null)) ?? null;
  return { step: Number(s.step), km: Number(s.km) || n * s.step, n, t: s.t, alt: fit(s.alt), spd, w: fit(s.w), hr: fit(s.hr), cad: fit(s.cad), temp: fit(s.temp) };
}

/** The index range of a km stretch. */
export const idxOf = (ser, km) => Math.max(0, Math.min(ser.n - 1, Math.round(km / ser.step)));

/** Max and mean (weighted by time, nulls left out) of one series in [i, j]. */
export function statOf(ser, key, i = 0, j = ser.n - 1) {
  const v = ser[key];
  if (!v) return null;
  let max = null;
  let s = 0;
  let w = 0;
  for (let k = i; k <= j; k++) {
    const x = v[k];
    if (!Number.isFinite(x)) continue;
    if (max == null || x > max) max = x;
    const dt = Math.max(1, (ser.t[k + 1] ?? ser.t[k] + 1) - ser.t[k]);
    s += x * Math.min(dt, 600);
    w += Math.min(dt, 600);
  }
  return max == null ? null : { max, avg: w ? s / w : null };
}

/**
 * The numbers of a stretch (the Sauce row and «Auswahl»): km, time (s), moving time, metres up, mean
 * gradient %, Ø km/h, Ø W, NP (4th-power mean over the steps), kJ, VAM (m/h).
 */
export function stretchOf(ser, fromKm, toKm) {
  const i = idxOf(ser, fromKm);
  const j = Math.max(i + 1, idxOf(ser, toKm));
  const km = (j - i) * ser.step;
  const time = (ser.t[j] ?? 0) - (ser.t[i] ?? 0);
  let up = 0;
  let moving = 0;
  let e = 0;
  let s4 = 0;
  let tw = 0;
  for (let k = i; k < j; k++) {
    const dt = (ser.t[k + 1] ?? ser.t[k]) - ser.t[k];
    const v = ser.spd?.[k];
    if (dt > 0 && (v == null || v > 2)) moving += Math.min(dt, (ser.step / Math.max(v ?? 3, 3)) * 3600 * 1.5);
    if (ser.alt && Number.isFinite(ser.alt[k + 1]) && Number.isFinite(ser.alt[k]) && ser.alt[k + 1] > ser.alt[k]) up += ser.alt[k + 1] - ser.alt[k];
    const w = ser.w?.[k];
    if (Number.isFinite(w) && dt > 0) (e += w * Math.min(dt, 600)), (s4 += w ** 4 * Math.min(dt, 600)), (tw += Math.min(dt, 600));
  }
  const rise = ser.alt && Number.isFinite(ser.alt[j]) && Number.isFinite(ser.alt[i]) ? ser.alt[j] - ser.alt[i] : null;
  return {
    km: Math.round(km * 100) / 100,
    time,
    moving: Math.round(moving),
    up: Math.round(up),
    grade: rise != null && km > 0 ? Math.round((rise / (km * 1000)) * 1000) / 10 : null,
    kmh: moving > 0 ? Math.round((km / (moving / 3600)) * 10) / 10 : null,
    w: tw ? Math.round(e / tw) : null,
    np: tw ? Math.round((s4 / tw) ** 0.25) : null,
    kj: tw ? Math.round(e / 1000) : null,
    vam: moving > 0 ? Math.round(up / (moving / 3600)) : null,
  };
}

/** The values at one km: { km, t, alt, grade, spd, w, hr, cad, temp }. */
export function pointOf(ser, km) {
  const k = idxOf(ser, km);
  const a = Math.max(0, k - 1);
  const b = Math.min(ser.n - 1, k + 1);
  const grade = ser.alt && Number.isFinite(ser.alt[b]) && Number.isFinite(ser.alt[a]) && b > a ? Math.round(((ser.alt[b] - ser.alt[a]) / ((b - a) * ser.step * 1000)) * 1000) / 10 : null;
  const at = (key) => (ser[key] ? ser[key][k] : null);
  return { km: k * ser.step, t: ser.t[k], alt: at('alt'), grade, spd: at('spd'), w: at('w'), hr: at('hr'), cad: at('cad'), temp: at('temp') };
}

/* ---------- Relative Leistung ---------- */

/** Monday of a day. */
const mondayOf = (day) => {
  const wd = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  return shiftDay(day, -wd);
};

/**
 * Strava's «Relative Leistung» (Relative Effort, a.effort): the week of the ride as 7 day sums, the
 * week's sum, and the last 12 weeks as sums with the range of the 3 weeks before each (the grey band).
 */
export function effortOf(a, acts = []) {
  if (!pos(a?.effort)) return null;
  const mon = mondayOf(a.day);
  const byDay = new Map();
  for (const o of acts) if (pos(o?.effort) && o.day) byDay.set(o.day, (byDay.get(o.day) ?? 0) + o.effort);
  const days = Array.from({ length: 7 }, (_, i) => ({ day: shiftDay(mon, i), v: byDay.get(shiftDay(mon, i)) ?? 0 }));
  const weekSum = (m) => Array.from({ length: 7 }, (_, i) => byDay.get(shiftDay(m, i)) ?? 0).reduce((x, y) => x + y, 0);
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const m = shiftDay(mon, -7 * (11 - i));
    const prev = [1, 2, 3].map((k) => weekSum(shiftDay(m, -7 * k)));
    const mean = prev.reduce((x, y) => x + y, 0) / 3;
    return { mon: m, v: weekSum(m), lo: Math.round(mean * 0.75), hi: Math.round(mean * 1.25) };
  });
  const now = weeks.at(-1);
  return { v: a.effort, days, week: now.v, lo: now.lo, hi: now.hi, weeks, place: now.v < now.lo ? 'below' : now.v > now.hi ? 'above' : 'in' };
}
