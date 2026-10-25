/**
 * Paket C › Woher stammt ein Wert? (996 Ideen UC-095-I2, UC-235-I1, UC-052-I1, UC-075-I1; 134 ideas in one):
 *
 *   Besondere Tage (DAYS_KEY): mark a day as special (a lot of work, travelling, ill …). A day without
 *     sport that carries a mark is not explained by the missing sport data alone. { kinds, marks: { day: [id] } }
 *   Gegenbeispiele: an insight of «Erkenntnisse» with the days that fit and the days that do not; the
 *     uncertainty shows as days, not as a statistic.
 *   Schlafplätze: selbst erlebt oder vermutet: every place to sleep of your own points says whether you
 *     slept there yourself, someone described it, or it was only imported (point.origin; a night or
 *     stars count as «slept there»).
 *   Wie sicher das Gewicht ist: the total of a packing list split into weighed, from a list or the
 *     maker (estimated) and unknown.
 * Pure, tested in tests/ruhig.test.js.
 */
import { isDay, addDays } from './base.js';
import { kindsOf } from './kinds.js';

/* ---------- Besondere Tage ---------- */

export const DAYS_KEY = 'ruhig.days';
export const DAY_STD = [
  { id: 'work', std: 'A lot of work' },
  { id: 'travel', std: 'Travelling' },
  { id: 'ill', std: 'Ill' },
  { id: 'family', std: 'Family' },
  { id: 'night', std: 'Bad night' },
];
export function specialDaysOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const kinds = kindsOf(v.kinds, DAY_STD);
  const marks = {};
  for (const [d, l] of Object.entries(v.marks && typeof v.marks === 'object' ? v.marks : {})) {
    const ids = [...new Set((Array.isArray(l) ? l : []).filter((x) => typeof x === 'string'))];
    if (isDay(d) && ids.length) marks[d] = ids;
  }
  return { kinds, marks };
}
export function flipDay(s, day, id) {
  const now = s.marks[day] ?? [];
  const next = now.includes(id) ? now.filter((x) => x !== id) : [...now, id];
  const marks = { ...s.marks };
  if (next.length) marks[day] = next;
  else delete marks[day];
  return { ...s, marks };
}
export const dayKindCount = (s, id) => Object.values(s.marks).filter((l) => l.includes(id)).length;
export function dropDayKind(s, id, to = null) {
  const marks = {};
  for (const [d, l] of Object.entries(s.marks)) {
    const next = [...new Set(l.flatMap((k) => (k === id ? (to ? [to] : []) : [k])))];
    if (next.length) marks[d] = next;
  }
  return { kinds: s.kinds.filter((k) => k.id !== id), marks };
}
/**
 * The last n days: [{ day, sport (a ride or a tick that day), marks: [id] }], newest first. A day without
 * sport and without a mark is «open»: nothing explains it, and that is fine too.
 */
export function recentDays(s, sportDays, today, n = 14) {
  const sp = new Set(sportDays);
  return Array.from({ length: n }, (_, i) => addDays(today, -i)).map((day) => ({ day, sport: sp.has(day), marks: s.marks[day] ?? [] }));
}

/* ---------- Gegenbeispiele ---------- */

/** The names of the series of erkenntnisse.js (English keys). */
export const SERIES_NAME = {
  sleepH: 'Sleep (Fitbit)',
  sleepFelt: 'Sleep, felt',
  battery: 'Battery',
  mood: 'Mood',
  sat: 'Happy with the day',
  km: 'Km by bike',
  med: 'Meditation',
  steps: 'Steps',
  rhr: 'Resting pulse',
  azm: 'Active zone minutes',
  sunH: 'Hours of sun',
  lightH: 'Daylight',
  rainMm: 'Rain',
  evts: 'Appointments',
};
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
/**
 * The days of one insight (a shown pair of erkenntnisse.js look(): x, y, lag, cut, rho) in the window:
 * fit = the days that go the way the sentence says, counter = the days against it.
 * [{ day, x, y }] each, newest first; ys split at their own median.
 */
export function counterDays(pair, series, days) {
  const X = series[pair.x] ?? {};
  const Y = series[pair.y] ?? {};
  const rows = [];
  for (const d of days) {
    const y = Y[pair.lag ? addDays(d, pair.lag) : d];
    if (X[d] == null || y == null) continue;
    rows.push({ day: d, x: X[d], y });
  }
  if (!rows.length || pair.cut == null) return { fit: [], counter: [] };
  const my = median(rows.map((r) => r.y));
  const up = (pair.rho ?? 0) >= 0;
  const fit = [];
  const counter = [];
  for (const r of rows) {
    const hiX = r.x > pair.cut;
    if (r.y === my) continue; // a middle value is neither for nor against
    const hiY = r.y > my;
    (hiX === hiY) === up ? fit.push(r) : counter.push(r);
  }
  const desc = (a, b) => b.day.localeCompare(a.day);
  return { fit: fit.sort(desc), counter: counter.sort(desc) };
}

/* ---------- Schlafplätze: selbst erlebt oder vermutet ---------- */

export const ORIGINS = [
  { key: 'visited', label: 'Slept there myself' },
  { key: 'described', label: 'Described by others' },
  { key: 'imported', label: 'Only imported' },
];
export const ORIGIN_KEYS = ORIGINS.map((o) => o.key);
/** The origin of an own point: set by hand, else a night or stars → visited, a file → imported, else ''. */
export function originOf(p) {
  if (ORIGIN_KEYS.includes(p?.origin)) return p.origin;
  if (p?.night || p?.stars) return 'visited';
  if (p?.src) return 'imported';
  return '';
}
/** The places to sleep grouped by origin: { visited: [], described: [], imported: [], '': [] }. */
export function sleepByOrigin(points = []) {
  const out = { visited: [], described: [], imported: [], '': [] };
  for (const p of points) if (p?.kind === 'sleep') out[originOf(p)].push(p);
  return out;
}

/* ---------- Wie sicher das Gewicht ist ---------- */

/** weightStatus of an item → 'measured' | 'estimated' | 'unknown' (db.js: logbook, online, measured, missing, conflict). */
export function sureOf(item) {
  if (!item || item.weightG == null || item.weightStatus === 'missing') return 'unknown';
  if (item.weightStatus === 'measured') return 'measured';
  return 'estimated';
}
/**
 * The weight of a packing list split by how sure it is: { total, measured: { g, n }, estimated: { g, n },
 * unknown: { n }, share (0–100, the weighed part of the known grams), toWeigh: [{ id, g }] heaviest
 * estimated first }. entries: trip.entries [{ itemId, qty }].
 */
export function weightSure(entries = [], itemsById = {}) {
  const out = { total: 0, measured: { g: 0, n: 0 }, estimated: { g: 0, n: 0 }, unknown: { n: 0 }, share: 0, toWeigh: [] };
  for (const e of entries) {
    const it = itemsById[e.itemId];
    const s = sureOf(it);
    if (s === 'unknown') {
      out.unknown.n++;
      continue;
    }
    const g = it.weightG * (e.qty || 1);
    out[s].g += g;
    out[s].n++;
    out.total += g;
    if (s === 'estimated') out.toWeigh.push({ id: it.id, g });
  }
  out.share = out.total ? Math.round((out.measured.g / out.total) * 100) : 0;
  out.toWeigh.sort((a, b) => b.g - a.g);
  return out;
}
