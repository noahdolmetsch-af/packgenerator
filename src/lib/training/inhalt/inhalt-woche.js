/**
 * «Mehr Inhalt» T1, T3, T4 (Noah 15.10.2026 «1-5 a»): the pure maths of three week cards.
 * T1 «Plan erfüllt?»: each planned session against the activity of its day and kind, and its main zone.
 * T3 «Ausdauer-Check»: aerobic decoupling (Pw:HR) of the long calm rides, first half against second half.
 * T4 «FTP über die Monate»: the estimated FTP (training.js ftpEstimate) at the end of each month, with W/kg.
 * Observation only: nothing here rates. Days are calendar days (YYYY-MM-DD); nothing reads the clock.
 */
import { ftpEstimate, shiftDay, mondayOf, isoWeek, zoneSecs, mainZone, wkg } from '../../training.js';
import { kgOn } from '../../weight.js';
import { mondays, monthStart, daysBetween, trendOf } from '../week/weeks.js';

/* ---------- T1 «Plan erfüllt?» ---------- */

export const PLAN_WEEKS = 6; // this week and the last 5

/**
 * One planned session against what was done. → { s, act, zone (1–5 | null), state } with state:
 * 'kept' (done, planned zone or no zone to compare), 'near' (±1 zone), 'other' (more than 1 zone off),
 * 'missed' (day passed, nothing of that kind), 'open' (today or later, nothing yet).
 * used: ids of activities already given to another session of the same day.
 */
export function sessionState(s, acts, today, bounds, used = new Set()) {
  const cands = acts.filter((a) => a.day === s.day && !used.has(a.id) && (s.kind === 'other' || a.kind === s.kind));
  // with two sessions on one day, each takes the activity closest to its planned minutes
  const act = cands.sort((a, b) => Math.abs((a.movingS || 0) / 60 - s.mins) - Math.abs((b.movingS || 0) / 60 - s.mins))[0] ?? null;
  if (!act) return { s, act: null, zone: null, diff: null, state: s.day < today ? 'missed' : 'open' };
  used.add(act.id);
  const mz = mainZone(zoneSecs(act.hist, bounds));
  const zone = mz == null ? null : mz + 1;
  const diff = zone != null && s.zone != null ? zone - s.zone : null;
  const state = diff == null || diff === 0 ? 'kept' : Math.abs(diff) === 1 ? 'near' : 'other';
  return { s, act, zone, diff, state };
}

/** Every session of a list against the activities (one activity per session). */
export function sessionStates(sessions, acts, today, bounds) {
  const used = new Set();
  return [...sessions].sort((a, b) => a.day.localeCompare(b.day)).map((s) => sessionState(s, acts, today, bounds, used));
}

/**
 * This week and the last n−1 weeks. → { weeks: [{ monday, kw, current, rows, due, kept, near, other, missed }], any }
 * due: sessions whose day has passed or that are done already (the open ones of today and later do not count yet).
 * any: is there a planned session in these weeks at all.
 */
export function planWeeks(plan, acts, today, bounds, n = PLAN_WEEKS) {
  const weeks = mondays(today, n).map((m) => {
    const end = shiftDay(m, 7);
    const rows = sessionStates(plan.filter((s) => s.day >= m && s.day < end), acts, today, bounds);
    const count = (st) => rows.filter((r) => r.state === st).length;
    return { monday: m, kw: isoWeek(m), current: m === mondayOf(today), rows, due: rows.filter((r) => r.state !== 'open').length, kept: count('kept'), near: count('near'), other: count('other'), missed: count('missed') };
  });
  return { weeks, any: weeks.some((w) => w.rows.length > 0) };
}

/* ---------- T3 «Ausdauer-Check» ---------- */

export const DEC_MONTHS = 6;
export const DEC_MIN_S = 3600;
export const DEC_GOOD = 5; // below 5 % is commonly read as a good endurance base
export const DEC_TREND_MIN = 3;

/**
 * Aerobic decoupling in % of one ride from its two halves [{ s, w, hr }]:
 * ((w1/hr1) − (w2/hr2)) / (w1/hr1) × 100, one decimal. null without both halves' power and heart rate.
 */
export function decoupling(halves) {
  if (!Array.isArray(halves) || halves.length !== 2 || !halves.every((h) => h && h.w > 0 && h.hr > 0)) return null;
  const [a, b] = halves.map((h) => h.w / h.hr);
  return Math.round(((a - b) / a) * 1000) / 10;
}

/** A long calm ride: at least an hour moving, a power meter, heart rate, both halves, mostly Z1–Z2. */
export const longCalm = (a, bounds) =>
  a.kind === 'bike' && a.wDevice && a.hrAvg > 0 && (a.movingS || 0) >= DEC_MIN_S && decoupling(a.halves) != null && (mainZone(zoneSecs(a.hist, bounds)) ?? 9) <= 1;

/**
 * The decoupling of the long calm rides since the start of the month DEC_MONTHS − 1 back, a straight trend
 * (from DEC_TREND_MIN rides) and the mean. → { from, span, pts: [{ day, x, v, id }], trend, mean }
 */
export function decouplePoints(acts, today, bounds, months = DEC_MONTHS) {
  const from = monthStart(today, months - 1);
  const span = daysBetween(from, today);
  const pts = acts
    .filter((a) => a.day >= from && a.day <= today && longCalm(a, bounds))
    .map((a) => ({ id: a.id, day: a.day, x: daysBetween(from, a.day), v: decoupling(a.halves) }))
    .sort((p, q) => p.x - q.x || p.id.localeCompare(q.id));
  const mean = pts.length ? Math.round((pts.reduce((s, p) => s + p.v, 0) / pts.length) * 10) / 10 : null;
  return { from, span, pts, trend: pts.length >= DEC_TREND_MIN ? trendOf(pts, span) : null, mean };
}

/* ---------- T4 «FTP über die Monate» ---------- */

export const FTP_MONTHS = 12;
export const HARD_DAYS = 42; // 6 weeks
export const HARD_SHARE = 0.9;

/** The last day of the month of a day; today for the month of today. */
export const monthEnd = (day, today) => {
  const end = shiftDay(monthStart(day, -1), -1);
  return end > today ? today : end;
};

/**
 * The estimated FTP at the end of each of the last n months (this month: today), with W/kg where a weight is
 * known. → [{ ym, end, ftp | null, kg | null, wkg | null }], oldest first.
 */
export function ftpMonths(acts, today, weights = [], n = FTP_MONTHS) {
  return Array.from({ length: n }, (_, i) => {
    const first = monthStart(today, n - 1 - i);
    const end = monthEnd(first, today);
    const ftp = ftpEstimate(acts, end);
    const kg = weights.length ? kgOn(weights, end) : null;
    return { ym: first.slice(0, 7), end, ftp, kg, wkg: ftp && kg ? wkg(ftp, kg) : null };
  });
}

/**
 * Was there a full 20-minute hard effort in the last 6 weeks: a ride whose best 20 minutes reach 90 % of
 * today's estimate? (A ride's best 20 minutes are only there when it had 20 minutes with power.) null without an estimate.
 */
export function hardRecently(acts, today, days = HARD_DAYS) {
  const ftp = ftpEstimate(acts, today);
  if (!ftp) return null;
  const from = shiftDay(today, -days);
  return acts.some((a) => a.day >= from && a.day <= today && Number.isFinite(a.w20) && a.w20 >= HARD_SHARE * ftp);
}
