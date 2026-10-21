/**
 * «Tour-Auswertung» (Noah 20.10.2026 «3a und b»): the values of a finished tour as the Garmin shows them,
 * for one activity or several joined into one tour. Pure maths, no page code:
 *   - time: moving, elapsed, stops (count and time), Ø speed, metres climbed;
 *   - power (only from a power meter): Ø, NP, max and the best 1, 2, 5, 10 and 20 minutes;
 *   - heart rate: Ø, max and the best 1, 2, 5, 10 and 20 minutes;
 *   - the resting heart rate from Fitbit on the tour's days next to «your normal», and every ride with a
 *     resting heart rate as a dot (resting HR against NP or Ø HR) to see a connection.
 * Observation only: numbers, no rating.
 */
import { hasMeter, npOfRides } from '../training/act/power.js';
import { pauseSecs } from '../training.js';
import { normalOf } from '../health.js';

/** The best-effort spans shown on the tour page: [seconds, label minutes]. */
export const ANA_SPANS = [
  [60, 1],
  [120, 2],
  [300, 5],
  [600, 10],
  [1200, 20],
];

const pos = (v) => (Number.isFinite(v) && v > 0 ? v : null);
const sum = (list, f) => list.reduce((s, a) => s + (pos(f(a)) ?? 0), 0);

/** The highest value of `span` in the curves of these activities ([[span, v], …]); null when none has it. */
export function bestOf(acts, field, span) {
  let best = null;
  for (const a of acts) {
    const p = Array.isArray(a?.[field]) ? a[field].find((x) => Array.isArray(x) && x[0] === span) : null;
    if (p && pos(p[1]) && (best == null || p[1] > best)) best = p[1];
  }
  return best;
}

/** A mean weighted by moving time; null when no activity has the value. */
function weighted(acts, f) {
  let s = 0;
  let n = 0;
  for (const a of acts) {
    const v = pos(f(a));
    const w = pos(a.movingS) ?? 0;
    if (v != null && w) (s += v * w), (n += w);
  }
  return n ? Math.round(s / n) : null;
}

/**
 * The values of a tour from its activities (with `own` corrections for km, Hm and moving time).
 * → { time: { moving, elapsed, stops, stopS, kmh, km, hm }, power | null, hr | null, missing: [what is not there yet] }
 */
export function tourValues(acts) {
  const list = (acts ?? []).filter(Boolean);
  const km = sum(list, (a) => a.own?.km ?? a.km);
  const hm = sum(list, (a) => a.own?.hm ?? a.hm);
  const moving = sum(list, (a) => a.own?.movingS ?? a.movingS);
  const elapsed = sum(list, (a) => a.elapsedS);
  const withPauses = list.filter((a) => a.pauses && Number.isFinite(a.pauses.n));
  const time = {
    km: km || null,
    hm: hm || null,
    moving: moving || null,
    elapsed: elapsed || null,
    stops: withPauses.length ? withPauses.reduce((s, a) => s + a.pauses.n, 0) : null,
    stopS: withPauses.length ? withPauses.reduce((s, a) => s + (pos(pauseSecs(a)) ?? 0), 0) : null,
    // without the stops counted, the time standing is elapsed − moving
    still: elapsed && moving && elapsed > moving ? elapsed - moving : null,
    kmh: km && moving ? Math.round((km / (moving / 3600)) * 10) / 10 : null,
  };

  const meter = list.filter(hasMeter);
  let power = null;
  if (meter.length) {
    power = {
      avg: weighted(meter, (a) => a.wAvg),
      // NP of several rides: one function with the Rückblick (npOfRides)
      np: npOfRides(meter),
      max: meter.reduce((m, a) => (pos(a.wMax) && a.wMax > (m ?? 0) ? a.wMax : m), null),
      best: ANA_SPANS.map(([s, min]) => ({ s, min, v: bestOf(meter, 'pCurve', s) ?? (s === 1200 ? meter.reduce((m, a) => (pos(a.w20) && a.w20 > (m ?? 0) ? a.w20 : m), null) : null) })),
    };
  }

  const withHr = list.filter((a) => pos(a.hrAvg));
  const hr = withHr.length
    ? {
        avg: weighted(withHr, (a) => a.hrAvg),
        max: withHr.reduce((m, a) => (pos(a.hrMax) && a.hrMax > (m ?? 0) ? a.hrMax : m), null),
        best: ANA_SPANS.map(([s, min]) => ({ s, min, v: bestOf(withHr, 'hCurve', s) })),
      }
    : null;

  const missing = [];
  if (power && power.best.some((b, i) => b.v == null && i < 4 && moving >= b.s)) missing.push('power');
  if (hr && hr.best.every((b) => b.v == null)) missing.push('hr');
  return { time, power, hr, missing };
}

/** The calendar days from `from` to `to` (both included), at most 31. */
export function daysOf(from, to) {
  const out = [];
  if (!from) return out;
  const d = new Date(`${from}T12:00:00Z`);
  const end = to && to > from ? to : from;
  while (out.length < 31) {
    const iso = d.toISOString().slice(0, 10);
    out.push(iso);
    if (iso >= end) break;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/**
 * The resting heart rate on the tour's days (Fitbit, healthDays) and «your normal» (the median of the 30 days
 * before the first day). → { days: [{ day, v }], first, normal, diff } or null when no day has one.
 */
export function restOfTour(health, from, to) {
  const rows = (health ?? []).filter((r) => r?.date).sort((a, b) => a.date.localeCompare(b.date));
  const by = new Map(rows.map((r) => [r.date, r.restingHr]));
  const days = daysOf(from, to).map((day) => ({ day, v: Number.isFinite(by.get(day)) ? by.get(day) : null }));
  const first = days.find((x) => x.v != null)?.v ?? null;
  if (first == null) return null;
  const normal = normalOf(rows, 'restingHr', from);
  return { days, first, normal: normal == null ? null : Math.round(normal), diff: normal == null ? null : Math.round(first - normal) };
}

/**
 * Every ride (bike activities) with a resting heart rate on its day, as a dot: { id, day, rest, y }
 * with y = NP when the ride has a power meter (mode 'np'), else Ø heart rate (mode 'hr').
 * mode 'np' when at least 3 rides have NP, else 'hr'. At most the newest `max`.
 */
export function restDots(acts, health, { max = 60 } = {}) {
  const rest = new Map((health ?? []).filter((r) => r?.date && Number.isFinite(r.restingHr)).map((r) => [r.date, r.restingHr]));
  const rides = (acts ?? []).filter((a) => a && a.kind === 'bike' && !a.hidden && rest.has(a.day)).sort((a, b) => `${b.day} ${b.time}`.localeCompare(`${a.day} ${a.time}`));
  const withNp = rides.filter((a) => hasMeter(a) && pos(a.wNorm));
  const mode = withNp.length >= 3 ? 'np' : 'hr';
  const dots = (mode === 'np' ? withNp : rides.filter((a) => pos(a.hrAvg)))
    .slice(0, max)
    .map((a) => ({ id: String(a.id), day: a.day, rest: rest.get(a.day), y: mode === 'np' ? a.wNorm : a.hrAvg }));
  return { mode, dots };
}

/** Pearson's r of the dots (rest against y), two decimals; null with fewer than 5 dots or no spread. */
export function corrOf(dots) {
  const n = dots?.length ?? 0;
  if (n < 5) return null;
  const mx = dots.reduce((s, d) => s + d.rest, 0) / n;
  const my = dots.reduce((s, d) => s + d.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const d of dots) (sxy += (d.rest - mx) * (d.y - my)), (sxx += (d.rest - mx) ** 2), (syy += (d.y - my) ** 2);
  if (!(sxx > 0 && syy > 0)) return null;
  return Math.round((sxy / Math.sqrt(sxx * syy)) * 100) / 100;
}

/** A calm word for r (observation only): 'none' |'weak' | 'clear', and the direction. */
export function corrWord(r) {
  if (r == null) return null;
  const a = Math.abs(r);
  return { strength: a < 0.2 ? 'none' : a < 0.5 ? 'weak' : 'clear', up: r > 0 };
}
