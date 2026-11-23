/**
 * More patterns for «Zusammenhänge» (Noah 23.11.2026, Thread «Zusammenhänge nützlicher machen»): the best range of a value, the days of the
 * week, the recovery after a hard day, what is new this week. Pure: series are { day: value } as seriesOf() makes them, days 'YYYY-MM-DD'.
 * Observation only: going together is not a cause, nothing is rated.
 */
import { addDays, lastDays, insights, BETTER_UP, median, mean, round1, niceCut, AZM_CUTS, CUT_SIDE, WINDOW_DAYS } from '../erkenntnisse.js';

/** Days of one band need at least this many days. */
export const BAND_MIN = 5;
/**
 * The best range of x for y (Noah 23.11.2026 «Bester Bereich»): the days are cut into a low, a middle and a high third by x (the cuts rounded as a
 * person would say), and the third where y was best is named with its mean against the other two. Only for a value with steps (not an activity that
 * is on or off) and when every third has BAND_MIN days.
 * → { from, to, mean, rest, n, rows: [{ from, to, mean, n }] } or null. from/to are null at the open ends.
 */
export function bestBand(row, series, days) {
  if (!row || row.x.startsWith('act:')) return null;
  const X = series[row.x] ?? {};
  const Y = series[row.y] ?? {};
  const pts = [];
  for (const d of days) {
    const y = Y[row.lag ? addDays(d, row.lag) : d];
    if (X[d] != null && y != null) pts.push({ x: X[d], y });
  }
  if (pts.length < BAND_MIN * 3) return null;
  const xs = pts.map((p) => p.x).sort((a, b) => a - b);
  const q = (f) => xs[Math.min(xs.length - 1, Math.floor(xs.length * f))];
  const c1 = niceCut(row.x, q(1 / 3));
  const c2 = niceCut(row.x, q(2 / 3));
  if (!(c1 < c2)) return null;
  const bands = [
    { from: null, to: c1, ys: pts.filter((p) => p.x <= c1).map((p) => p.y) },
    { from: c1, to: c2, ys: pts.filter((p) => p.x > c1 && p.x <= c2).map((p) => p.y) },
    { from: c2, to: null, ys: pts.filter((p) => p.x > c2).map((p) => p.y) },
  ];
  if (bands.some((b) => b.ys.length < BAND_MIN)) return null;
  const rows = bands.map((b) => ({ from: b.from, to: b.to, mean: round1(mean(b.ys)), n: b.ys.length }));
  const up = BETTER_UP.has(row.y);
  const best = rows.reduce((a, b) => ((up ? b.mean > a.mean : b.mean < a.mean) ? b : a));
  const rest = round1(mean(bands.filter((b) => b.from !== best.from).flatMap((b) => b.ys)));
  if (best.mean === rest) return null;
  return { from: best.from, to: best.to, mean: best.mean, rest, n: best.n, rows };
}

/** The weekdays 0 (Monday) … 6 (Sunday) of a day. */
export const weekday = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
/** The values shown by weekday: these, and how clear a difference must be (|t|). */
export const WEEKDAY_VALUES = ['battery', 'mood', 'sleepH', 'rhr', 'hrv'];
export const WEEKDAY_T = 3;
/** At least this many days per weekday, and at least this many weekdays with data. */
export const WEEKDAY_MIN = 4;

/**
 * The lowest and the highest weekday of a value (Noah 23.11.2026 «Wochentage»): the mean per weekday over the window, shown only when the two
 * differ by 3 times their own standard error (seven days and five values make many chances, so the bar is high). The strongest two values.
 * → [{ y, means: [7 × { mean, n } | null], low: weekday, high: weekday, t }]
 */
export function weekdayPattern(series, today, { days = WINDOW_DAYS, top = 2 } = {}) {
  const span = lastDays(today, days);
  const out = [];
  for (const y of WEEKDAY_VALUES) {
    const Y = series[y] ?? {};
    const by = Array.from({ length: 7 }, () => []);
    for (const d of span) if (Y[d] != null) by[weekday(d)].push(Y[d]);
    const ok = by.map((l, i) => ({ i, l })).filter((x) => x.l.length >= WEEKDAY_MIN);
    if (ok.length < 5) continue;
    const all = ok.flatMap((x) => x.l);
    const m = mean(all);
    const sd = Math.sqrt(all.reduce((a, v) => a + (v - m) ** 2, 0) / Math.max(1, all.length - 1));
    if (!sd) continue;
    const means = by.map((l) => (l.length >= WEEKDAY_MIN ? { mean: round1(mean(l)), n: l.length } : null));
    const mm = ok.map((x) => ({ i: x.i, m: mean(x.l), n: x.l.length }));
    const low = mm.reduce((a, b) => (b.m < a.m ? b : a));
    const high = mm.reduce((a, b) => (b.m > a.m ? b : a));
    const t = (high.m - low.m) / (sd * Math.sqrt(1 / low.n + 1 / high.n));
    if (t >= WEEKDAY_T) out.push({ y, means, low: low.i, high: high.i, t: round1(t) });
  }
  return out.sort((a, b) => b.t - a.t).slice(0, top);
}

/** Days after a hard day that are looked at (0 = the day itself is not part: the pulse of that morning came before). */
export const RECOVERY_DAYS = 5;
export const RECOVERY_MIN = 5;
/** The pulse counts as «normal again» within this many beats of the own normal. */
export const RECOVERY_BEATS = 1;

/**
 * Recovery after a hard day (Noah 23.11.2026 «Erholungszeit»): on days over a round number of active zone minutes (200, 150, … as in AZM_CUTS, or
 * the top quarter), how far the resting pulse of the next days lies above your normal (median of the window), and after how many days it is back
 * within RECOVERY_BEATS. Also the long run: the resting pulse of the last 30 days against the 30 before.
 * → { cut, n, normal, steps: [{ k, dev, n }], backAfter: k | null, peak, trend: { now, before, diff } | null } or null (not enough hard days)
 */
export function recoveryOf(series, today, { days = WINDOW_DAYS } = {}) {
  const span = lastDays(today, days);
  const A = series.azm ?? {};
  const R = series.rhr ?? {};
  const vals = span.map((d) => A[d]).filter((v) => v != null);
  const rr = span.map((d) => R[d]).filter((v) => v != null);
  if (rr.length < 14) return null;
  let cut = vals.length < 14 ? null : AZM_CUTS.find((c) => vals.filter((v) => v > c).length >= RECOVERY_MIN && vals.filter((v) => v <= c).length >= CUT_SIDE);
  if (cut == null && vals.length >= 14) {
    const s = [...vals].sort((a, b) => a - b);
    cut = niceCut('azm', s[Math.floor(s.length * 0.75)]);
    if (vals.filter((v) => v > cut).length < RECOVERY_MIN) cut = null;
  }
  const normal = median(rr);
  const hard = cut == null ? [] : span.filter((d) => A[d] != null && A[d] > cut);
  const steps = [];
  for (let k = 1; k <= RECOVERY_DAYS; k++) {
    const v = hard.map((d) => R[addDays(d, k)]).filter((x) => x != null);
    if (v.length >= RECOVERY_MIN) steps.push({ k, dev: round1(mean(v) - normal), n: v.length });
  }
  const last30 = lastDays(today, 30).map((d) => R[d]).filter((v) => v != null);
  const prev30 = lastDays(addDays(today, -30), 30).map((d) => R[d]).filter((v) => v != null);
  const trend = last30.length >= 10 && prev30.length >= 10 ? { now: round1(median(last30)), before: round1(median(prev30)), diff: round1(median(last30) - median(prev30)) } : null;
  if (!steps.length && !trend) return null;
  const peak = steps.length ? Math.max(...steps.map((s) => s.dev)) : 0;
  const peakStep = steps.find((x) => x.dev === peak);
  const back = peak > RECOVERY_BEATS && peakStep ? steps.find((x) => x.k > peakStep.k && x.dev <= RECOVERY_BEATS) : null;
  return { cut, n: hard.length, normal: round1(normal), steps, peak, backAfter: back ? back.k : null, trend };
}

/**
 * What is new this week (Noah 23.11.2026 «Neu diese Woche»): the insights that show today but did not show a week ago, or that got clearly
 * stronger (|rho| up by 0.15 or more). The strongest `top`, each with `fresh` ('new' | 'stronger').
 */
export function newThisWeek(series, today, opt = {}, top = 2) {
  const now = insights(series, today, opt).filter((x) => x.shown);
  const before = new Map(insights(series, addDays(today, -7), opt).filter((x) => x.shown).map((x) => [x.id, x]));
  return now
    .map((x) => {
      const b = before.get(x.id);
      return !b ? { ...x, fresh: 'new' } : Math.abs(x.rho) - Math.abs(b.rho) >= 0.15 ? { ...x, fresh: 'stronger' } : null;
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho))
    .slice(0, top);
}

