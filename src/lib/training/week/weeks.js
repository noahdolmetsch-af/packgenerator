/**
 * TR7d–TR7f «Analysen über die Wochen» (Noah 14.10.2026 «TR5–TR7 freigegeben»): the pure maths of the six
 * week cards. Loads per activity, fitness / fatigue / form (CTL / ATL / TSB), load per week, the best power
 * per span (90 days against the year), watts per heartbeat on calm rides with a trend, month and year sums.
 * Days are calendar days (YYYY-MM-DD); nothing here reads the clock.
 */
import { ftpEstimate, powerLoad, shiftDay, mondayOf, isoWeek, zoneSecs, mainZone } from '../../training.js';

export const WEEKS = 16;
export const CTL_DAYS = 42;
export const ATL_DAYS = 7;
export const CURVE_SPANS = [5, 60, 300, 1200, 3600];
export const CURVE_DAYS = 90;
export const EFF_MONTHS = 4;
export const EFF_MIN = 4;
export const NEAR = 0.025;

const r1 = (x) => Math.round(x * 10) / 10;

/** The load of one activity: power load with a power meter (NP and an FTP), else Strava's Relative Effort, else 0. */
export function actLoad(a, acts) {
  if (a?.wNorm > 0) {
    const p = powerLoad(a, ftpEstimate(acts, a.day));
    if (p) return p.load;
  }
  return a?.effort > 0 ? a.effort : 0;
}

/** The load of every activity: Map id → load. */
export const loadsOf = (acts) => new Map(acts.map((a) => [a.id, actLoad(a, acts)]));

/** Load per day: Map day → sum. */
export function dailyLoads(acts, loads = loadsOf(acts)) {
  const m = new Map();
  for (const a of acts) if (a.day) m.set(a.day, (m.get(a.day) ?? 0) + (loads.get(a.id) ?? 0));
  return m;
}

/**
 * Fitness (CTL, 42 days), fatigue (ATL, 7 days) and form (TSB = CTL − ATL of the day before), every day from
 * the first activity to today. → Map day → { ctl, atl, tsb } (unrounded).
 */
export function formDays(acts, today, loads = loadsOf(acts)) {
  const daily = dailyLoads(acts, loads);
  const days = [...daily.keys()].filter((d) => d <= today).sort();
  const out = new Map();
  if (!days.length) return out;
  let ctl = 0;
  let atl = 0;
  for (let d = days[0]; d <= today; d = shiftDay(d, 1)) {
    const tsb = ctl - atl;
    const l = daily.get(d) ?? 0;
    ctl += (l - ctl) / CTL_DAYS;
    atl += (l - atl) / ATL_DAYS;
    out.set(d, { ctl, atl, tsb });
  }
  return out;
}

/** The Mondays of the last n weeks, oldest first, this week last. */
export const mondays = (today, n = WEEKS) => Array.from({ length: n }, (_, i) => shiftDay(mondayOf(today), (i - n + 1) * 7));

/**
 * One point per week (the value on the week's Sunday, or today for this week) for n weeks, and today's values.
 * → { weeks: [{ monday, kw, ctl, atl, tsb }], now: { ctl, atl, tsb } } rounded, or null without activities.
 */
export function formWeeks(acts, today, n = WEEKS) {
  const f = formDays(acts, today);
  if (!f.size) return null;
  const zero = { ctl: 0, atl: 0, tsb: 0 };
  const round = (v) => ({ ctl: Math.round(v.ctl) || 0, atl: Math.round(v.atl) || 0, tsb: Math.round(v.tsb) || 0 });
  const weeks = mondays(today, n).map((m) => {
    const end = shiftDay(m, 6) < today ? shiftDay(m, 6) : today;
    return { monday: m, kw: isoWeek(m), ...round(f.get(end) ?? zero) };
  });
  return { weeks, now: round(f.get(today) ?? zero) };
}

/** Load and count per week for n weeks, this week (until today) last. → [{ monday, kw, load, n, current }] */
export function weekLoads(acts, today, n = WEEKS, loads = loadsOf(acts)) {
  return mondays(today, n).map((m) => {
    const end = shiftDay(m, 7);
    const list = acts.filter((a) => a.day >= m && a.day < end && a.day <= today);
    return { monday: m, kw: isoWeek(m), load: Math.round(list.reduce((s, a) => s + (loads.get(a.id) ?? 0), 0)), n: list.length, current: m === mondayOf(today) };
  });
}

/** The best mean power of a span from one activity's curve [[span s, W]]; null without. */
const curveAt = (a, span) => {
  const p = Array.isArray(a?.pCurve) ? a.pCurve.find((x) => Array.isArray(x) && x[0] === span) : null;
  return p && p[1] > 0 ? p[1] : null;
};

/**
 * Per span the best of the last 90 days and of the calendar year (with the day it came from).
 * → [{ span, d90: { w, day } | null, year: { w, day } | null }]
 */
export function curveBests(acts, today, days = CURVE_DAYS) {
  const from90 = shiftDay(today, -days);
  const fromYear = `${today.slice(0, 4)}-01-01`;
  const best = (list, span) => list.reduce((b, a) => {
    const w = curveAt(a, span);
    return w && (!b || w > b.w) ? { w, day: a.day } : b;
  }, null);
  const in90 = acts.filter((a) => a.day >= from90 && a.day <= today);
  const inYear = acts.filter((a) => a.day >= fromYear && a.day <= today);
  return CURVE_SPANS.map((span) => ({ span, d90: best(in90, span), year: best(inYear, span) }));
}

/** «gleich» (same), «fast gleich» (within 2.5 %, so 214 / 219 W reads as nearly the same) or null. */
export function nearSame(a, b) {
  if (!(a > 0) || !(b > 0)) return null;
  if (a === b) return 'same';
  return Math.abs(a - b) / Math.max(a, b) <= NEAR ? 'near' : null;
}

/** The first day of the month n months before the month of day. */
export function monthStart(day, n = 0) {
  const y = Number(day.slice(0, 4));
  const m = Number(day.slice(5, 7)) - 1 - n;
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, '0')}-01`;
}

/** Days between two calendar days. */
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

/**
 * Watts per heartbeat (NP ÷ mean heart rate) of the calm rides (main zone Z2) since the start of the month
 * four months back, and a straight trend (least squares over the days).
 * → { from, pts: [{ day, x, v }], trend: { a, b, start, end, startDay } | null }
 */
export function effPoints(acts, today, bounds, months = EFF_MONTHS) {
  const from = monthStart(today, months - 1);
  const pts = acts
    .filter((a) => a.day >= from && a.day <= today && a.wNorm > 0 && a.hrAvg > 0 && mainZone(zoneSecs(a.hist, bounds)) === 1)
    .map((a) => ({ day: a.day, x: daysBetween(from, a.day), v: Math.round((a.wNorm / a.hrAvg) * 1000) / 1000 }))
    .sort((p, q) => p.x - q.x);
  return { from, to: today, span: daysBetween(from, today), pts, trend: trendOf(pts, daysBetween(from, today)) };
}

/** Least squares y = a + b·x; with the trend's values at the first point and at xEnd. null with fewer than 2 x. */
export function trendOf(pts, xEnd) {
  const n = pts.length;
  if (n < 2) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.v, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (!sxx) return null;
  const b = pts.reduce((s, p) => s + (p.x - mx) * (p.v - my), 0) / sxx;
  const a = my - b * mx;
  const x0 = pts[0].x;
  return { a, b, x0, start: a + b * x0, end: a + b * xEnd };
}

/** km, Hm, hours (one decimal), load and count of a list of activities (every sport). */
export function sums(list, loads) {
  return {
    km: Math.round(list.reduce((s, a) => s + (a.km || 0), 0)),
    hm: Math.round(list.reduce((s, a) => s + (a.hm || 0), 0)),
    h: r1(list.reduce((s, a) => s + (a.movingS || 0), 0) / 3600),
    load: Math.round(list.reduce((s, a) => s + (loads?.get(a.id) ?? 0), 0)),
    n: list.length,
  };
}

/** The sums of one month 'YYYY-MM'. */
export const monthSums = (acts, ym, loads = loadsOf(acts)) => sums(acts.filter((a) => a.day?.slice(0, 7) === ym), loads);

/** Default months: the last full month and the one before. → [ym, ym] */
export const defaultMonths = (today) => [monthStart(today, 1).slice(0, 7), monthStart(today, 2).slice(0, 7)];

/** The same day one year back (29 Feb → 28 Feb). */
export function lastYearDay(day) {
  const y = Number(day.slice(0, 4)) - 1;
  const md = day.slice(5) === '02-29' ? '02-28' : day.slice(5);
  return `${y}-${md}`;
}

/** This year from 1 January to today against last year from 1 January to the same day. */
export function yearSums(acts, today, loads = loadsOf(acts)) {
  const y = today.slice(0, 4);
  const prevEnd = lastYearDay(today);
  const py = prevEnd.slice(0, 4);
  return {
    cur: { year: y, to: today, ...sums(acts.filter((a) => a.day >= `${y}-01-01` && a.day <= today), loads) },
    prev: { year: py, to: prevEnd, ...sums(acts.filter((a) => a.day >= `${py}-01-01` && a.day <= prevEnd), loads) },
  };
}

/** Axis ticks: a round step (1, 2, 2.5, 5 × 10^k) so that about `count` ticks span lo…hi. → { lo, hi, ticks } */
export function niceTicks(lo, hi, count = 4) {
  if (!(hi > lo)) hi = lo + 1;
  const raw = (hi - lo) / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw);
  const a = Math.floor(lo / step + 1e-9) * step;
  const b = Math.ceil(hi / step - 1e-9) * step;
  const ticks = [];
  for (let v = a; v <= b + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { lo: a, hi: b, ticks, step };
}
