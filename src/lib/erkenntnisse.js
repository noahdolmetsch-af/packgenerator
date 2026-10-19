/**
 * «Erkenntnisse» (Noah 19.10.2026 «4b» + «zusätzlich eine eigene Seite»): what goes together in your own
 * data, said in one plain sentence. The answers of «Wi gaht's?» (sleep felt, battery, mood, satisfaction),
 * the Fitbit days (sleep, resting pulse, active zone minutes, steps), the Strava rides and the meditation.
 *
 * How: for fixed pairs (x → y, the same day or the day after) the days with both values are taken (the last
 * 90 days). From MIN_DAYS on, the rank correlation (Spearman) says whether they go together; from MIN_RHO on
 * it is shown, as «on days with more x, y was … on average, otherwise …» (the days above the median of x
 * against the others). Observation only: going together is not a cause, nothing is a diagnosis.
 * Pure rules: no database, no clock (days 'YYYY-MM-DD').
 *
 * Noah 19.10.2026 «2a 3a 4a und b möglich»: also the weather and daylight of the day (daydata.js, Open-Meteo),
 * the appointments per day (the Google calendar) and every own number question (scale or number) — each own
 * question on by itself and switchable off one by one (setting OWN_OFF_KEY).
 */
import { numberOf } from './abfragen.js';

/** The own questions switched off for the insights: a list of ids (settings). */
export const OWN_OFF_KEY = 'insightsOwnOff';

export const WINDOW_DAYS = 90;
export const MIN_DAYS = 14;
export const MIN_RHO = 0.3;
export const CLEAR_RHO = 0.5;
/** The resting pulse: this many days in a row above the normal (median of 30 days) plus RHR_ABOVE. */
export const RHR_DAYS = 3;
export const RHR_ABOVE = 5;

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The days from `today - n + 1` to `today`. */
export const lastDays = (today, n) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const round1 = (x) => Math.round(x * 10) / 10;

/** The value of a question per day (the mean when answered more than once). */
function perDay(rows, qid) {
  const acc = {};
  for (const r of rows) {
    if (r?.qid !== qid || !r.day) continue;
    const v = num(typeof r.value === 'string' ? Number(r.value) : r.value);
    if (v == null) continue;
    (acc[r.day] ??= []).push(v);
  }
  return Object.fromEntries(Object.entries(acc).map(([d, l]) => [d, mean(l)]));
}

/**
 * All series, each { day: value }.
 * rows: the history (abdb.js historyQuery: answers, old daily checks, Strava rides as kind 'ride');
 * health: the Fitbit days (healthDays); log: the Aktiv ticks (flowLog). `days`: the days where a missing
 * ride or meditation counts as 0 (only days where the app was used at all).
 */
export function seriesOf({ rows = [], health = [], log = [], days = [], weather = {}, events = {}, own = [] } = {}) {
  const used = new Set(days);
  const km = {};
  for (const r of rows) if (r?.kind === 'ride' && r.day && num(r.value) != null) km[r.day] = (km[r.day] ?? 0) + r.value;
  const med = {};
  for (const l of log) if (l?.actId === 'meditation' && l.day && num(l.min) != null) med[l.day] = (med[l.day] ?? 0) + l.min;
  const answered = new Set(rows.filter((r) => r?.day && r.kind !== 'ride').map((r) => r.day));
  const zero = (map) => {
    const out = { ...map };
    for (const d of used) if (answered.has(d) && out[d] == null) out[d] = 0;
    return out;
  };
  const h = (k) => Object.fromEntries(health.filter((r) => r?.date).map((r) => [r.date, k === 'sleep' ? num(r.sleep?.asleepMin) != null ? round1(r.sleep.asleepMin / 60) : null : num(r[k])]).filter(([, v]) => v != null));
  return {
    sleepFelt: perDay(rows, 'erholung.schlaf'),
    battery: perDay(rows, 'erholung.akku'),
    mood: perDay(rows, 'spass.stimmung'),
    sat: perDay(rows, 'erreicht.zufrieden'),
    km: zero(km),
    med: zero(med),
    sleepH: h('sleep'),
    rhr: h('restingHr'),
    azm: h('azm'),
    steps: h('steps'),
    ...weatherSeries(weather),
    evts: events && typeof events === 'object' ? Object.fromEntries(Object.entries(events).filter(([, v]) => num(v) != null)) : {},
    ...ownSeries(rows, own),
  };
}

/** The weather days { day: { tmax, rainMm, sunH, lightH } } as four series. */
function weatherSeries(weather) {
  const out = { sunH: {}, lightH: {}, rainMm: {}, tmax: {} };
  for (const [day, w] of Object.entries(weather ?? {})) for (const k of Object.keys(out)) if (num(w?.[k]) != null) out[k][day] = w[k];
  return out;
}

/** The own questions that count as numbers (scale or number) and are not switched off. */
export function ownNumberQuestions(own = [], off = []) {
  const no = new Set(Array.isArray(off) ? off : []);
  return (own ?? []).filter((q) => q?.id && (q.form?.kind === 'scale' || q.form?.kind === 'number') && !no.has(q.id));
}

/** One series per own question, key `own:<id>` (the mean when answered more than once a day). */
export function ownSeries(rows = [], own = []) {
  const out = {};
  for (const q of own ?? []) {
    if (!q?.id) continue;
    const acc = {};
    for (const r of rows) {
      if (r?.qid !== q.id || !r.day) continue;
      const v = numberOf(q.form, r.value);
      if (num(v) != null) (acc[r.day] ??= []).push(v);
    }
    out[`own:${q.id}`] = Object.fromEntries(Object.entries(acc).map(([d, l]) => [d, mean(l)]));
  }
  return out;
}

/** The pairs of the own questions: each with mood and battery the same day. name: the user's text (never t()). */
export const ownPairs = (own = []) =>
  (own ?? []).flatMap((q) => [
    { id: `own-${q.id}-mood`, x: `own:${q.id}`, y: 'mood', lag: 0, own: q.id, name: q.text ?? q.name ?? '' },
    { id: `own-${q.id}-battery`, x: `own:${q.id}`, y: 'battery', lag: 0, own: q.id, name: q.text ?? q.name ?? '' },
  ]);

/**
 * The pairs looked at: x on a day, y on the same day (lag 0) or the day after (lag 1).
 * The Fitbit sleep of a date is the night before it, so «active minutes → sleep» looks at the next date.
 */
export const PAIRS = [
  { id: 'sleep-battery', x: 'sleepH', y: 'battery', lag: 0 },
  { id: 'sleepfelt-battery', x: 'sleepFelt', y: 'battery', lag: 0 },
  { id: 'sleep-mood', x: 'sleepH', y: 'mood', lag: 0 },
  { id: 'km-mood', x: 'km', y: 'mood', lag: 0 },
  { id: 'km-sat', x: 'km', y: 'sat', lag: 0 },
  { id: 'med-mood', x: 'med', y: 'mood', lag: 0 },
  { id: 'steps-sat', x: 'steps', y: 'sat', lag: 0 },
  { id: 'rhr-battery', x: 'rhr', y: 'battery', lag: 0 },
  { id: 'azm-rhr', x: 'azm', y: 'rhr', lag: 1 },
  { id: 'azm-sleep', x: 'azm', y: 'sleepH', lag: 1 },
  { id: 'km-rhr', x: 'km', y: 'rhr', lag: 1 },
  // weather and daylight (2a): the day's sun, daylight, rain
  { id: 'sun-mood', x: 'sunH', y: 'mood', lag: 0 },
  { id: 'sun-battery', x: 'sunH', y: 'battery', lag: 0 },
  { id: 'light-mood', x: 'lightH', y: 'mood', lag: 0 },
  { id: 'rain-mood', x: 'rainMm', y: 'mood', lag: 0 },
  // appointments (3a): the day itself, and the night after it (felt sleep and Fitbit sleep are of the next date)
  { id: 'evts-battery', x: 'evts', y: 'battery', lag: 0 },
  { id: 'evts-mood', x: 'evts', y: 'mood', lag: 0 },
  { id: 'evts-sleepfelt', x: 'evts', y: 'sleepFelt', lag: 1 },
  { id: 'evts-sleep', x: 'evts', y: 'sleepH', lag: 1 },
];

/** Ranks with ties shared (1-based). */
function ranks(vals) {
  const idx = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(vals.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k][1]] = r;
    i = j + 1;
  }
  return out;
}

/** Spearman's rank correlation of two equally long lists, null when one does not vary. */
export function spearman(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mx = mean(rx);
  const my = mean(ry);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < rx.length; i++) {
    sxy += (rx[i] - mx) * (ry[i] - my);
    sxx += (rx[i] - mx) ** 2;
    syy += (ry[i] - my) ** 2;
  }
  if (!sxx || !syy) return null;
  return sxy / Math.sqrt(sxx * syy);
}

const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * One pair over the given days: { id, x, y, lag, n, rho, ready, shown, clear, cut, hi: { mean, n }, lo: { mean, n } }.
 * ready: enough days; shown: ready and |rho| ≥ MIN_RHO and both groups have days.
 */
export function look(pair, series, days, { minDays = MIN_DAYS, minRho = MIN_RHO } = {}) {
  const X = series[pair.x] ?? {};
  const Y = series[pair.y] ?? {};
  const xs = [];
  const ys = [];
  for (const d of days) {
    const x = X[d];
    const y = Y[pair.lag ? addDays(d, pair.lag) : d];
    if (x == null || y == null) continue;
    xs.push(x);
    ys.push(y);
  }
  const n = xs.length;
  const base = { ...pair, n, rho: null, ready: n >= minDays, shown: false, clear: false, cut: null, hi: null, lo: null };
  if (!base.ready) return base;
  const rho = spearman(xs, ys);
  if (rho == null) return base;
  // the split at the median; when no day lies above it (few distinct values, e.g. 1 or 6 appointments),
  // the next lower value splits instead, so «more than» stays true and both groups have days
  let cut = median(xs);
  if (!xs.some((x) => x > cut)) {
    const lower = xs.filter((x) => x < cut);
    if (lower.length) cut = Math.max(...lower);
  }
  const hiY = ys.filter((_, i) => xs[i] > cut);
  const loY = ys.filter((_, i) => xs[i] <= cut);
  const hi = hiY.length ? { mean: round1(mean(hiY)), n: hiY.length } : null;
  const lo = loY.length ? { mean: round1(mean(loY)), n: loY.length } : null;
  const shown = Math.abs(rho) >= minRho && !!hi && !!lo && hi.mean !== lo.mean;
  return { ...base, rho: Math.round(rho * 100) / 100, shown, clear: Math.abs(rho) >= CLEAR_RHO, cut: round1(cut), hi, lo };
}

/** All pairs for «today», the strongest first; `shown` ones are the insights, the others wait or show nothing. */
export function insights(series, today, { days = WINDOW_DAYS, own = [], ...opt } = {}) {
  const span = lastDays(today, days);
  const all = [...PAIRS, ...ownPairs(own)].map((p) => look(p, series, span, opt));
  return all.sort((a, b) => Number(b.shown) - Number(a.shown) || Math.abs(b.rho ?? 0) - Math.abs(a.rho ?? 0) || b.n - a.n);
}

/**
 * The resting pulse above the own normal: the last RHR_DAYS days (up to today) each over the median of the 30
 * days before them plus RHR_ABOVE. { normal, last: [values] } or null. Observation only, never a diagnosis.
 */
export function rhrHigh(health = [], today) {
  const by = Object.fromEntries(health.filter((r) => r?.date && num(r.restingHr) != null).map((r) => [r.date, r.restingHr]));
  const recent = lastDays(today, RHR_DAYS);
  if (recent.some((d) => by[d] == null)) return null;
  const before = lastDays(addDays(recent[0], -1), 30).map((d) => by[d]).filter((v) => v != null);
  if (before.length < 7) return null;
  const normal = median(before);
  const last = recent.map((d) => by[d]);
  return last.every((v) => v > normal + RHR_ABOVE) ? { normal: round1(normal), last } : null;
}
